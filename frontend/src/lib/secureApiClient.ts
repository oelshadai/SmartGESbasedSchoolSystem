import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiBaseUrl } from '@/lib/apiBase';

// Production-ready security configuration
const SECURITY_CONFIG = {
  MAX_RETRIES: 2,
  REQUEST_TIMEOUT: 30000, // 30 seconds for login requests
  FILE_UPLOAD_TIMEOUT: 300000, // 5 minutes for file uploads
  RATE_LIMIT_WINDOW: 60000,
  MAX_REQUESTS_PER_WINDOW: 100,
};

// Auth endpoints that must not send a stale Bearer token (DRF rejects invalid JWT before AllowAny views run)
const PUBLIC_AUTH_PATHS = [
  '/auth/admin-login/',
  '/auth/register-school/',
  '/auth/teacher-login/',
  '/auth/superadmin-login/',
  '/auth/parent-login/',
  '/auth/student-login/',
  '/auth/login/',
  '/auth/register/',
  '/auth/forgot-password/',
  '/auth/confirm-reset-password/',
  '/auth/token/refresh/',
  '/auth/csrf-token/',
];

function isPublicAuthPath(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

// Rate limiting tracker
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Enhanced API Client
class SecureApiClient {
  private client: AxiosInstance;
  private rateLimiter = new RateLimiter();

  constructor() {
    const baseURL = getApiBaseUrl();
    
    this.client = axios.create({
      baseURL,
      timeout: SECURITY_CONFIG.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false,
      // Production-ready retry configuration
      validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx as success
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting check
        const userId = useAuthStore.getState().user?.id?.toString() || 'anonymous';
        if (!this.rateLimiter.isAllowed(userId)) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Add authentication token (skip on public auth paths to avoid stale-token 401s)
        const token = this.getStoredToken();
        if (!isPublicAuthPath(config.url)) {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          // No token: let the request go — the 401 response interceptor will
          // attempt a refresh. Only hard-fail if refresh also fails.
        }

        // Ensure Content-Type is set for POST/PUT/PATCH
        // For FormData, let axios set Content-Type automatically (includes multipart boundary)
        if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
          if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            config.timeout = SECURITY_CONFIG.FILE_UPLOAD_TIMEOUT;
          } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - try token refresh first, then logout
        // Skip refresh only for login/token endpoints (not protected /auth/* routes)
        // Also skip if the body is FormData — FormData cannot be replayed after being consumed;
        // a 401 on a FormData upload means the token was genuinely missing/expired before
        // the upload started, so redirect to login immediately.
        const isAuthEndpoint = isPublicAuthPath(originalRequest?.url);
        const isFormData = originalRequest?.data instanceof FormData;
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isFormData) {
          originalRequest._retry = true;
          try {
            await this.refreshAuthToken();
            const newToken = this.getStoredToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch {
            this.handleAuthFailure();
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        }

        // For FormData 401s: refresh token silently then reject so the caller can retry
        if (error.response?.status === 401 && isFormData && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAuthToken();
          } catch {
            this.handleAuthFailure();
          }
          return Promise.reject(this.enhanceError(error));
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const userId = useAuthStore.getState().user?.id?.toString() || 'anonymous';
          this.rateLimiter.reset(userId);
          throw new Error('Too many requests. Please wait before trying again.');
        }

        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  private enhanceError(error: any): Error {
    // Production-ready error handling with detailed logging
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.code === 'ECONNABORTED',
      network: !error.response && Boolean(error.request),
      aborted: error.message?.includes('timeout') || error.message?.includes('Network Error') || error.code === 'ERR_NETWORK'
    };
    
    // Log for debugging in development — skip expected 404s (e.g. optional permission checks)
    if (import.meta.env.DEV) {
      const silentPaths = ['/staff-permissions/my-permissions/'];
      const isSilent = silentPaths.some(p => errorDetails.url?.includes(p)) && errorDetails.status === 404;
      if (!isSilent) {
        console.error('API Error Details:', errorDetails);
      }
    }
    
    // Create production-friendly error messages
    let message = 'Request failed';
    
    if (errorDetails.timeout) {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (errorDetails.network) {
      message = 'No response received from the server. Please try again.';
    } else if (errorDetails.aborted) {
      message = 'Network error. Please check your connection.';
    } else if (error.response?.data?.detail) {
      message = error.response.data.detail;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    const enhancedError = new Error(message);
    (enhancedError as any).response = error.response;
    (enhancedError as any).config = error.config;
    (enhancedError as any).isTimeout = errorDetails.timeout;
    (enhancedError as any).isNetwork = errorDetails.network;
    
    return enhancedError;
  }

  private getStoredToken(): string | null {
    const authState = useAuthStore.getState();
    const storeToken = authState.accessToken;
    if (storeToken) {
      return storeToken;
    }

    // Try sessionStorage first; fall back to localStorage (survives page refresh)
    let token = sessionStorage.getItem('access_token');
    if (!token) {
      token = localStorage.getItem('access_token');
      // Restore into sessionStorage for this tab
      if (token) sessionStorage.setItem('access_token', token);
    }
    if (token) {
      try {
        return atob(token.split('').reverse().join(''));
      } catch {
        return token;
      }
    }
    return null;
  }

  private async refreshAuthToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const deobfuscatedToken = atob(refreshToken.split('').reverse().join(''));
      const response = await axios.post(`${this.client.defaults.baseURL}/auth/token/refresh/`, {
        refresh: deobfuscatedToken
      });

      const { access, refresh: newRefreshRaw } = response.data;
      const obfuscatedAccess = btoa(access).split('').reverse().join('');
      const timestamp = Date.now().toString();
      // Write to both storages so the token survives page refreshes
      sessionStorage.setItem('access_token', obfuscatedAccess);
      sessionStorage.setItem('token_timestamp', timestamp);
      localStorage.setItem('access_token', obfuscatedAccess);
      localStorage.setItem('token_timestamp', timestamp);

      // If backend rotated the refresh token, persist the new one
      const updatedRefresh = newRefreshRaw || deobfuscatedToken;
      const obfuscatedRefresh = btoa(updatedRefresh).split('').reverse().join('');
      localStorage.setItem('refresh_token', obfuscatedRefresh);

      useAuthStore.getState().setTokens(access, updatedRefresh);
    } catch (error) {
      // If refresh fails, clear everything and force login
      this.handleAuthFailure();
      throw error;
    }
  }

  private handleAuthFailure(): void {
    // Clear auth data only — don't wipe unrelated localStorage keys
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_timestamp');
    sessionStorage.removeItem('user_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('refresh_token');
    useAuthStore.getState().logout();

    // Force redirect to login
    window.location.href = '/login';
  }

  // Production-ready health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/auth/csrf-token/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }

  // Retry helper for cold-start resilience (Render free tier can take 30-60s to wake)
  private async withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 3000): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isConnectionError = !error.response && (
          error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_CONNECTION_REFUSED')
        );
        
        if (isConnectionError && attempt < retries) {
          console.info(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Request failed after retries');
  }

  // Public API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Login and registration endpoints get automatic retry for cold-start resilience
    const isAuthEndpoint = url.includes('/auth/') && (url.includes('login') || url.includes('register'));
    if (isAuthEndpoint) {
      const response = await this.withRetry(() => this.client.post<T>(url, data, config));
      return response.data;
    }
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Secure logout
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await this.client.post('/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.getState().logout();
    }
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient();
export default secureApiClient;