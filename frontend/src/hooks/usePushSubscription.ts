import { useCallback, useEffect, useState } from 'react';
import { secureApiClient } from '@/lib/secureApiClient';

type PushStatus = 'checking' | 'available' | 'enabled' | 'denied' | 'unsupported';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
};

const usePushSubscription = (isLoggedIn: boolean) => {
  const [status, setStatus] = useState<PushStatus>('checking');

  useEffect(() => {
    if (!isLoggedIn) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    let isMounted = true;
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await sendToBackend(subscription);
        }
        if (isMounted) setStatus(subscription ? 'enabled' : 'available');
      } catch (error) {
        console.error('Failed to check browser push subscription:', error);
        if (isMounted) setStatus('available');
      }
    };

    void checkSubscription();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  const enablePushNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      throw new Error('Sign in before enabling browser notifications.');
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      setStatus('unsupported');
      throw new Error('This browser does not support push notifications.');
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      throw new Error('Browser notifications are blocked. Allow notifications for this site in your browser settings.');
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'available');
      throw new Error('Notification permission was not granted.');
    }

    setStatus('checking');
    try {
      const { vapidPublicKey } = await secureApiClient.get<{ vapidPublicKey: string }>(
        '/notifications/push/vapid-public-key/'
      );
      if (!vapidPublicKey) {
        throw new Error('Push notifications are not configured on the server.');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      try {
        await sendToBackend(subscription);
      } catch (error) {
        if (!existing) await subscription.unsubscribe();
        throw error;
      }
      setStatus('enabled');
    } catch (error) {
      setStatus('available');
      throw error;
    }
  }, [isLoggedIn]);

  return { status, enablePushNotifications };
};

const sendToBackend = async (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  if (!json.keys?.p256dh || !json.keys.auth) {
    throw new Error('The browser did not provide valid push subscription keys.');
  }

  await secureApiClient.post('/notifications/push/subscribe/', {
    endpoint: subscription.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
};

export default usePushSubscription;
