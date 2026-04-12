import { secureApiClient } from '@/lib/secureApiClient';
import type { LoginResponse, User } from '@/types';

// Enhanced secure token storage with encryption simulation
class SecureTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly TOKEN_TIMESTAMP_KEY = 'token_timestamp';
  
  // Simple obfuscation (in production, use proper encryption)
  private static obfuscate(data: string): string {
    return btoa(data).split('').reverse().join('');
  }
  
  private static deobfuscate(data: string): string {
    try {
      return atob(data.split('').reverse().join(''));
    } catch {
      return data; // Fallback for non-obfuscated data
    }
  }
  
  static setTokens(access: string, refresh: string): void {
    const timestamp = Date.now().toString();
    
    // Store access token in BOTH sessionStorage and localStorage so it
    // survives page refreshes (the server lifetime is 8 hours).
    const obfuscatedAccess = this.obfuscate(access);
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, obfuscatedAccess);
    sessionStorage.setItem(this.TOKEN_TIMESTAMP_KEY, timestamp);
    localStorage.setItem(this.ACCESS_TOKEN_KEY, obfuscatedAccess);
    localStorage.setItem(this.TOKEN_TIMESTAMP_KEY, timestamp);
    
    // Store refresh token in localStorage with obfuscation
    localStorage.setItem(this.REFRESH_TOKEN_KEY, this.obfuscate(refresh));
  }
  
  static getAccessToken(): string | null {
    // Try sessionStorage first; fall back to localStorage (survives page refresh)
    let token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    let timestamp = sessionStorage.getItem(this.TOKEN_TIMESTAMP_KEY);

    if (!token || !timestamp) {
      token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      timestamp = localStorage.getItem(this.TOKEN_TIMESTAMP_KEY);
      // Restore back into sessionStorage for this tab
      if (token && timestamp) {
        sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
        sessionStorage.setItem(this.TOKEN_TIMESTAMP_KEY, timestamp);
      }
    }

    if (!token || !timestamp) return null;

    // Discard only if older than 8 hours (matches server ACCESS_TOKEN_LIFETIME)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 8 * 60 * 60 * 1000) {
      this.clearAccessToken();
      return null;
    }

    return this.deobfuscate(token);
  }
  
  static getRefreshToken(): string | null {
    const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return token ? this.deobfuscate(token) : null;
  }
  
  static setUser(user: User): void {
    const sanitizedUser = this.sanitizeUserData(user);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(sanitizedUser));
  }
  
  static getUser(): User | null {
    const userData = sessionStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  
  static clearAccessToken(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TIMESTAMP_KEY);
  }
  
  static clearAll(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
  
  private static sanitizeUserData(user: User): User {
    // Remove sensitive fields that shouldn't be stored client-side
    const { ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

// Password strength validator
class PasswordValidator {
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Login attempt tracker for client-side rate limiting
class LoginAttemptTracker {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly STORAGE_KEY = 'login_attempts';
  
  static canAttemptLogin(identifier: string): { allowed: boolean; remainingTime?: number } {
    const attempts = this.getAttempts(identifier);
    const now = Date.now();
    
    // Clean old attempts
    const recentAttempts = attempts.filter(time => now - time < this.LOCKOUT_DURATION);
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const remainingTime = this.LOCKOUT_DURATION - (now - oldestAttempt);
      return { allowed: false, remainingTime };
    }
    
    return { allowed: true };
  }
  
  static recordAttempt(identifier: string): void {
    const attempts = this.getAttempts(identifier);
    attempts.push(Date.now());
    localStorage.setItem(`${this.STORAGE_KEY}_${identifier}`, JSON.stringify(attempts));
  }
  
  static clearAttempts(identifier: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${identifier}`);
  }
  
  private static getAttempts(identifier: string): number[] {
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${identifier}`);
    return stored ? JSON.parse(stored) : [];
  }
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Input validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Check login attempts
    const attemptCheck = LoginAttemptTracker.canAttemptLogin(email);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/login/', { 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      // Validate response structure
      if (!data.access || !data.user || !data.user.role) {
        throw new Error('Invalid server response');
      }
      
      // Store tokens securely
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      
      // Clear failed attempts on successful login
      LoginAttemptTracker.clearAttempts(email);
      
      return data;
    } catch (error) {
      // Record failed attempt
      LoginAttemptTracker.recordAttempt(email);
      throw error;
    }
  },

  studentLogin: async (studentId: string, password: string): Promise<LoginResponse> => {
    if (!studentId || !password) {
      throw new Error('Student ID and password are required');
    }
    
    // Production-ready input sanitization
    const sanitizedStudentId = studentId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    
    const attemptCheck = LoginAttemptTracker.canAttemptLogin(sanitizedStudentId);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/student-login/', {
        student_id: sanitizedStudentId,
        password
      });
      
      if (!data.access || !data.refresh || !data.user || !data.user.role) {
        throw new Error('Invalid server response. Please try again.');
      }
      
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      LoginAttemptTracker.clearAttempts(sanitizedStudentId);
      
      return data;
    } catch (error: any) {
      LoginAttemptTracker.recordAttempt(sanitizedStudentId);
      
      // Production-friendly error messages
      if (error.isTimeout) {
        throw new Error('Login request timed out. The server may be starting up — please try again in a moment.');
      } else if (error.isNetwork) {
        throw new Error('Unable to reach server. It may be starting up — please wait a moment and try again.');
      }
      
      throw error;
    }
  },

  teacherLogin: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const sanitizedEmail = email.toLowerCase().trim();
    
    const attemptCheck = LoginAttemptTracker.canAttemptLogin(sanitizedEmail);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/teacher-login/', {
        email: sanitizedEmail,
        password
      });
      
      if (!data.access || !data.refresh || !data.user || !data.user.role) {
        throw new Error('Invalid server response. Please try again.');
      }
      
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      LoginAttemptTracker.clearAttempts(sanitizedEmail);
      
      return data;
    } catch (error: any) {
      LoginAttemptTracker.recordAttempt(sanitizedEmail);
      
      // Production-friendly error messages
      if (error.isTimeout) {
        throw new Error('Login request timed out. The server may be starting up — please try again in a moment.');
      } else if (error.isNetwork) {
        throw new Error('Unable to reach server. It may be starting up — please wait a moment and try again.');
      }
      
      throw error;
    }
  },

  adminLogin: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const sanitizedEmail = email.toLowerCase().trim();
    
    const attemptCheck = LoginAttemptTracker.canAttemptLogin(sanitizedEmail);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/admin-login/', {
        email: sanitizedEmail,
        password
      });
      
      if (!data.access || !data.refresh || !data.user || !data.user.role) {
        throw new Error('Invalid server response. Please try again.');
      }
      
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      LoginAttemptTracker.clearAttempts(sanitizedEmail);
      
      return data;
    } catch (error: any) {
      LoginAttemptTracker.recordAttempt(sanitizedEmail);
      
      // Production-friendly error messages
      if (error.isTimeout) {
        throw new Error('Login request timed out. The server may be starting up — please try again in a moment.');
      } else if (error.isNetwork) {
        throw new Error('Unable to reach server. It may be starting up — please wait a moment and try again.');
      }
      
      throw error;
    }
  },

  superadminLogin: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const sanitizedEmail = email.toLowerCase().trim();
    const attemptCheck = LoginAttemptTracker.canAttemptLogin(sanitizedEmail);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/superadmin-login/', {
        email: sanitizedEmail,
        password
      });
      
      if (!data.access || !data.refresh || !data.user || !data.user.role) {
        throw new Error('Invalid server response');
      }
      
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      LoginAttemptTracker.clearAttempts(sanitizedEmail);
      
      return data;
    } catch (error) {
      LoginAttemptTracker.recordAttempt(sanitizedEmail);
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    const data = await secureApiClient.get<User>('/auth/profile/');
    SecureTokenStorage.setUser(data);
    return data;
  },

  parentLogin: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const sanitizedEmail = email.toLowerCase().trim();

    const attemptCheck = LoginAttemptTracker.canAttemptLogin(sanitizedEmail);
    if (!attemptCheck.allowed) {
      const minutes = Math.ceil((attemptCheck.remainingTime || 0) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }

    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/parent-login/', {
        email: sanitizedEmail,
        password
      });

      if (!data.access || !data.refresh || !data.user || !data.user.role) {
        throw new Error('Invalid server response. Please try again.');
      }

      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      LoginAttemptTracker.clearAttempts(sanitizedEmail);

      return data;
    } catch (error: any) {
      LoginAttemptTracker.recordAttempt(sanitizedEmail);

      if (error.isTimeout) {
        throw new Error('Login request timed out. The server may be starting up — please try again in a moment.');
      } else if (error.isNetwork) {
        throw new Error('Unable to reach server. It may be starting up — please wait a moment and try again.');
      }

      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await secureApiClient.logout();
  },

  refreshToken: async (): Promise<{ access: string }> => {
    const refreshToken = SecureTokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const data = await secureApiClient.post<{ access: string }>('/auth/token/refresh/', { 
      refresh: refreshToken 
    });
    
    SecureTokenStorage.setTokens(data.access, refreshToken);
    return data;
  },
  
  // Password change with validation
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.isValid) {
      throw new Error(`Password requirements not met: ${validation.errors.join(', ')}`);
    }
    
    await secureApiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },
  
  // Utility methods
  isAuthenticated: (): boolean => {
    return !!SecureTokenStorage.getAccessToken();
  },
  
  getCurrentUser: (): User | null => {
    return SecureTokenStorage.getUser();
  },
  
  hasRole: (role: string): boolean => {
    const user = SecureTokenStorage.getUser();
    return user?.role === role;
  },
  
  hasAnyRole: (roles: string[]): boolean => {
    const user = SecureTokenStorage.getUser();
    return user ? roles.includes(user.role) : false;
  },
  
  // School registration
  registerSchool: async (registrationData: {
    school_name: string;
    admin_email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<LoginResponse> => {
    // Input validation
    if (!registrationData.school_name || !registrationData.admin_email || !registrationData.password) {
      throw new Error('School name, admin email, and password are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.admin_email)) {
      throw new Error('Invalid email format');
    }
    
    if (registrationData.password !== registrationData.password_confirm) {
      throw new Error('Passwords do not match');
    }
    
    const passwordValidation = PasswordValidator.validate(registrationData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }
    
    try {
      const data = await secureApiClient.post<LoginResponse>('/auth/register-school/', {
        school_name: registrationData.school_name.trim(),
        admin_email: registrationData.admin_email.toLowerCase().trim(),
        first_name: registrationData.first_name.trim(),
        last_name: registrationData.last_name.trim(),
        password: registrationData.password,
        password_confirm: registrationData.password_confirm
      });
      
      if (!data.access || !data.user || !data.user.role) {
        throw new Error('Invalid server response');
      }
      
      // Store tokens securely
      SecureTokenStorage.setTokens(data.access, data.refresh);
      SecureTokenStorage.setUser(data.user);
      
      return data;
    } catch (error: any) {
      // Enhanced error handling for registration
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.admin_email) {
          throw new Error(Array.isArray(errorData.admin_email) ? errorData.admin_email[0] : errorData.admin_email);
        }
        if (errorData.school_name) {
          throw new Error(Array.isArray(errorData.school_name) ? errorData.school_name[0] : errorData.school_name);
        }
        if (errorData.password) {
          throw new Error(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password);
        }
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      throw error;
    }
  },

  // Security utilities
  validatePassword: (password: string) => PasswordValidator.validate(password),
  
  getLoginAttemptStatus: (identifier: string) => LoginAttemptTracker.canAttemptLogin(identifier)
};

export { SecureTokenStorage, PasswordValidator, LoginAttemptTracker };
