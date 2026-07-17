import React, { useEffect, useCallback, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';

interface SecurityProviderProps {
  children: ReactNode;
}

// Security monitoring and session management component
export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { 
    checkSessionValidity, 
    updateLastActivity, 
    isAuthenticated, 
    securityLevel,
    logout 
  } = useAuthStore();

  // Activity tracking
  const trackActivity = useCallback(() => {
    if (isAuthenticated) {
      updateLastActivity();
    }
  }, [isAuthenticated, updateLastActivity]);

  // Session validation
  const validateSession = useCallback(() => {
    if (isAuthenticated && !checkSessionValidity()) {
      console.warn('Session expired or invalid');
      logout();
    }
  }, [isAuthenticated, checkSessionValidity, logout]);

  // Security event handlers
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      validateSession();
      trackActivity();
    }
  }, [validateSession, trackActivity]);

  const handleBeforeUnload = useCallback(() => {
    // Clear sensitive data on page unload for high security users
    if (securityLevel === 'high') {
      sessionStorage.clear();
    }
  }, [securityLevel]);

  // Detect suspicious activity
  const handleSecurityEvent = useCallback((event: Event) => {
    const suspiciousEvents = ['contextmenu', 'selectstart', 'dragstart'];
    
    if (securityLevel === 'high' && suspiciousEvents.includes(event.type)) {
      console.warn('Suspicious activity detected:', event.type);
      // Could implement additional security measures here
    }
  }, [securityLevel]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity tracking events
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ];

    // Session validation interval
    const sessionCheckInterval = setInterval(validateSession, 60000); // Check every minute

    // Activity tracking listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Security event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // High security monitoring
    if (securityLevel === 'high') {
      document.addEventListener('contextmenu', handleSecurityEvent);
      document.addEventListener('selectstart', handleSecurityEvent);
      document.addEventListener('dragstart', handleSecurityEvent);
    }

    // Cleanup
    return () => {
      clearInterval(sessionCheckInterval);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (securityLevel === 'high') {
        document.removeEventListener('contextmenu', handleSecurityEvent);
        document.removeEventListener('selectstart', handleSecurityEvent);
        document.removeEventListener('dragstart', handleSecurityEvent);
      }
    };
  }, [
    isAuthenticated, 
    securityLevel, 
    trackActivity, 
    validateSession, 
    handleVisibilityChange, 
    handleBeforeUnload, 
    handleSecurityEvent
  ]);

  // Initial session validation on mount
  useEffect(() => {
    if (isAuthenticated) {
      validateSession();
    }
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;