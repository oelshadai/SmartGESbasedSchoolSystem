import { useEffect } from 'react';
import { secureApiClient } from '@/lib/secureApiClient';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const usePushSubscription = (isLoggedIn: boolean) => {
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribe = async () => {
      try {
        // Ask permission — only prompts once; subsequent calls return existing state
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          // Re-send to backend in case it was lost
          await sendToBackend(existing);
          return;
        }

        // Fetch VAPID public key from backend
        const { vapidPublicKey } = await secureApiClient.get<{ vapidPublicKey: string }>(
          '/notifications/push/vapid-public-key/'
        );
        if (!vapidPublicKey) return;

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await sendToBackend(subscription);
      } catch {
        // Silently ignore — push is best-effort
      }
    };

    const sendToBackend = async (sub: PushSubscription) => {
      const json = sub.toJSON();
      await secureApiClient.post('/notifications/push/subscribe/', {
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });
    };

    subscribe();
  }, [isLoggedIn]);
};

export default usePushSubscription;
