import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return; // Already installed, don't show prompt
    }

    // Check if dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      if (parseInt(dismissedAt) > threeDaysAgo) {
        return;
      }
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show instructions after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('pwa-installed', 'true');
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Install App</h3>
            </div>
            <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Add School Report to your home screen:</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap the <strong>Share</strong> button <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs">⬆️</span> at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong>"Add"</strong> to confirm</span>
              </li>
            </ol>
          </div>
          
          <Button 
            onClick={handleDismiss}
            className="w-full mt-6 bg-green-600 hover:bg-green-700"
          >
            Got it!
          </Button>
        </div>
      </div>
    );
  }

  // Main Install Banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl max-w-md mx-auto p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <img 
              src="/EliteTech logo with 3D cube design.png" 
              alt="Elite Tech"
              className="w-8 h-8 object-contain"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base">Install School Report</h3>
            <p className="text-white/80 text-sm mt-0.5">
              Add to home screen for quick access
            </p>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1 text-white hover:bg-white/10 hover:text-white border border-white/30"
          >
            Not now
          </Button>
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-green-700 hover:bg-gray-100 font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
