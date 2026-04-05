import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Production-ready security configuration
const SECURITY_CONFIG = {
  MAX_RETRIES: 2,
  REQUEST_TIMEOUT: 30000, // 30 seconds for login requests
  RATE_LIMIT_WINDOW: 60000,
  MAX_REQUESTS_PER_WINDOW: 100,
};

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
    // Production-ready base URL handling
    const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
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

        // Add authentication token
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Ensure Content-Type is set for POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
          if (!config.headers['Content-Type']) {
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
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAuthToken();
            // Update the Authorization header with the new token
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
      network: !error.response && !error.request
    };
    
    // Log for debugging in development
    if (import.meta.env.DEV) {
      console.error('API Error Details:', errorDetails);
    }
    
    // Create production-friendly error messages
    let message = 'Request failed';
    
    if (errorDetails.timeout) {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (errorDetails.network) {
      message = 'Network error. Please check your internet connection.';
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
    const token = sessionStorage.getItem('access_token');
    if (token) {
      try {
        // Deobfuscate using the same method as authService
        return atob(token.split('').reverse().join(''));
      } catch {
        return token; // Return as-is if not obfuscated
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
      sessionStorage.setItem('access_token', obfuscatedAccess);

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
    // Clear all auth data completely
    sessionStorage.clear();
    localStorage.clear();
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
    // Login endpoints get automatic retry for cold-start resilience
    const isLoginEndpoint = url.includes('/auth/') && url.includes('login');
    if (isLoginEndpoint) {
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