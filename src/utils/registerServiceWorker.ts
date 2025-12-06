/**
 * Register Firebase Messaging Service Worker
 * This should be called once when the app starts
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('✅ Service Worker registered successfully:', registration.scope);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }
}

