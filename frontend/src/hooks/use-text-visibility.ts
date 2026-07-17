import { useState, useEffect, useCallback } from 'react';

export interface TextVisibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  enhancedReadability: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'enhanced';
}

const DEFAULT_PREFERENCES: TextVisibilityPreferences = {
  highContrast: false,
  largeText: false,
  enhancedReadability: true,
  reducedMotion: false,
  fontSize: 'medium',
  contrast: 'normal',
};

const STORAGE_KEY = 'text-visibility-preferences';

export function useTextVisibility() {
  const [preferences, setPreferences] = useState<TextVisibilityPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load text visibility preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Failed to save text visibility preferences:', error);
      }
    }
  }, [preferences, isLoaded]);

  // Apply preferences to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    
    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Apply large text
    if (preferences.largeText) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }

    // Apply enhanced readability
    if (preferences.enhancedReadability) {
      root.classList.add('enhanced-readability');
    } else {
      root.classList.remove('enhanced-readability');
    }

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply font size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${preferences.fontSize}`);

    // Apply contrast level
    root.classList.remove('contrast-normal', 'contrast-high', 'contrast-enhanced');
    root.classList.add(`contrast-${preferences.contrast}`);

  }, [preferences, isLoaded]);

  // Detect system preferences
  useEffect(() => {
    if (!isLoaded) return;

    const mediaQueries = {
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    };

    const handleMediaChange = () => {
      setPreferences(prev => ({
        ...prev,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches,
        reducedMotion: prev.reducedMotion || mediaQueries.reducedMotion.matches,
      }));
    };

    // Set initial values based on system preferences
    handleMediaChange();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', handleMediaChange);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', handleMediaChange);
      });
    };
  }, [isLoaded]);

  const updatePreference = useCallback(<K extends keyof TextVisibilityPreferences>(
    key: K,
    value: TextVisibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const toggleHighContrast = useCallback(() => {
    updatePreference('highContrast', !preferences.highContrast);
  }, [preferences.highContrast, updatePreference]);

  const toggleLargeText = useCallback(() => {
    updatePreference('largeText', !preferences.largeText);
  }, [preferences.largeText, updatePreference]);

  const toggleEnhancedReadability = useCallback(() => {
    updatePreference('enhancedReadability', !preferences.enhancedReadability);
  }, [preferences.enhancedReadability, updatePreference]);

  const toggleReducedMotion = useCallback(() => {
    updatePreference('reducedMotion', !preferences.reducedMotion);
  }, [preferences.reducedMotion, updatePreference]);

  const increaseFontSize = useCallback(() => {
    const sizes: TextVisibilityPreferences['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(preferences.fontSize);
    if (currentIndex < sizes.length - 1) {
      updatePreference('fontSize', sizes[currentIndex + 1]);
    }
  }, [preferences.fontSize, updatePreference]);

  const decreaseFontSize = useCallback(() => {
    const sizes: TextVisibilityPreferences['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(preferences.fontSize);
    if (currentIndex > 0) {
      updatePreference('fontSize', sizes[currentIndex - 1]);
    }
  }, [preferences.fontSize, updatePreference]);

  const getTextClasses = useCallback((baseClasses: string = '') => {
    const classes = [baseClasses];

    if (preferences.highContrast) {
      classes.push('text-high-contrast');
    }

    if (preferences.enhancedReadability) {
      classes.push('readable-text');
    }

    if (preferences.largeText) {
      classes.push('text-lg');
    }

    switch (preferences.contrast) {
      case 'high':
        classes.push('text-high-contrast');
        break;
      case 'enhanced':
        classes.push('text-primary-enhanced');
        break;
    }

    return classes.filter(Boolean).join(' ');
  }, [preferences]);

  const getButtonClasses = useCallback((baseClasses: string = '') => {
    const classes = [baseClasses];

    if (preferences.highContrast) {
      classes.push('high-contrast-button');
    }

    return classes.filter(Boolean).join(' ');
  }, [preferences]);

  const getCardClasses = useCallback((baseClasses: string = '') => {
    const classes = [baseClasses];

    if (preferences.highContrast) {
      classes.push('high-contrast-card');
    }

    return classes.filter(Boolean).join(' ');
  }, [preferences]);

  return {
    preferences,
    isLoaded,
    updatePreference,
    resetPreferences,
    toggleHighContrast,
    toggleLargeText,
    toggleEnhancedReadability,
    toggleReducedMotion,
    increaseFontSize,
    decreaseFontSize,
    getTextClasses,
    getButtonClasses,
    getCardClasses,
  };
}

// CSS classes for different font sizes and contrast levels
export const TEXT_VISIBILITY_STYLES = `
  .font-size-small {
    font-size: 14px;
  }
  
  .font-size-medium {
    font-size: 16px;
  }
  
  .font-size-large {
    font-size: 18px;
  }
  
  .font-size-extra-large {
    font-size: 20px;
  }
  
  .large-text-mode {
    font-size: 1.125em;
  }
  
  .large-text-mode h1 {
    font-size: 2.5rem;
  }
  
  .large-text-mode h2 {
    font-size: 2rem;
  }
  
  .large-text-mode h3 {
    font-size: 1.75rem;
  }
  
  .large-text-mode .text-sm {
    font-size: 1rem;
  }
  
  .large-text-mode .text-xs {
    font-size: 0.875rem;
  }
  
  .high-contrast-mode {
    --text-primary: 0 0% 0%;
    --text-secondary: 0 0% 20%;
    --text-muted: 0 0% 40%;
    --border: 0 0% 50%;
  }
  
  .dark.high-contrast-mode {
    --text-primary: 0 0% 100%;
    --text-secondary: 0 0% 90%;
    --text-muted: 0 0% 70%;
    --border: 0 0% 60%;
  }
  
  .enhanced-readability {
    line-height: 1.7;
    letter-spacing: 0.01em;
  }
  
  .enhanced-readability p {
    margin-bottom: 1rem;
  }
  
  .enhanced-readability h1,
  .enhanced-readability h2,
  .enhanced-readability h3,
  .enhanced-readability h4,
  .enhanced-readability h5,
  .enhanced-readability h6 {
    margin-bottom: 0.75rem;
    margin-top: 1.5rem;
  }
  
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .contrast-high {
    filter: contrast(1.5);
  }
  
  .contrast-enhanced {
    filter: contrast(1.2);
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = TEXT_VISIBILITY_STYLES;
  document.head.appendChild(styleElement);
}