// Security utilities for the school management system

// Input validation and sanitization
export class SecurityUtils {
  
  // XSS prevention
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // SQL injection prevention for search queries
  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/['"`;\\]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate student ID format
  static isValidStudentId(studentId: string): boolean {
    const studentIdRegex = /^[A-Z0-9]{3,10}$/;
    return studentIdRegex.test(studentId);
  }

  // Validate file uploads
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 1024; // 1KB

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    if (file.size < minSize) {
      return { isValid: false, error: 'File is too small' };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
      /\.com$/i, /\.jar$/i, /\.js$/i, /\.vbs$/i, /\.php$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return { isValid: false, error: 'Suspicious file type detected' };
    }

    return { isValid: true };
  }

  // Generate secure random strings
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return result;
  }

  // Validate URLs
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Content Security Policy helpers
  static createNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }

      const userRequests = requests.get(identifier)!;
      const validRequests = userRequests.filter(time => time > windowStart);

      if (validRequests.length >= maxRequests) {
        return false;
      }

      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }
}

// Security monitoring
export class SecurityMonitor {
  private static events: Array<{ type: string; timestamp: number; details: any }> = [];
  private static readonly MAX_EVENTS = 100;

  static logSecurityEvent(type: string, details: any = {}): void {
    const event = {
      type,
      timestamp: Date.now(),
      details: {
        ...details,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.events.unshift(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Log critical events to console
    if (['auth_failure', 'suspicious_activity', 'csrf_failure'].includes(type)) {
      console.warn('Security Event:', event);
    }
  }

  static getSecurityEvents(type?: string): Array<any> {
    if (type) {
      return this.events.filter(event => event.type === type);
    }
    return [...this.events];
  }

  static clearEvents(): void {
    this.events = [];
  }
}

// Secure form helpers
export class SecureFormUtils {
  
  // Prevent form data leakage
  static sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = SecurityUtils.sanitizeHtml(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? SecurityUtils.sanitizeHtml(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Validate form fields
  static validateFormField(fieldName: string, value: any, rules: any): { isValid: boolean; error?: string } {
    if (rules.required && (!value || value.toString().trim() === '')) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (rules.minLength && value.toString().length < rules.minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${rules.minLength} characters` };
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return { isValid: false, error: `${fieldName} must not exceed ${rules.maxLength} characters` };
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return { isValid: false, error: `${fieldName} format is invalid` };
    }

    if (rules.email && !SecurityUtils.isValidEmail(value.toString())) {
      return { isValid: false, error: `${fieldName} must be a valid email address` };
    }

    return { isValid: true };
  }
}

// Environment security checks
export class EnvironmentSecurity {
  
  static checkBrowserSecurity(): { secure: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for HTTPS in production
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      warnings.push('Application should be served over HTTPS');
    }

    // Check for secure context
    if (!window.isSecureContext) {
      warnings.push('Application is not running in a secure context');
    }

    // Check for required APIs
    if (!window.crypto || !window.crypto.getRandomValues) {
      warnings.push('Crypto API not available');
    }

    // Check for localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch {
      warnings.push('localStorage not available');
    }

    return {
      secure: warnings.length === 0,
      warnings
    };
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

export default {
  SecurityUtils,
  SecurityMonitor,
  SecureFormUtils,
  EnvironmentSecurity
};