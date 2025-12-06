/**
 * Firebase Cloud Messaging Service Worker
 * Handles background notifications when app is closed or in background
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdVpD6Hf2uNQ_VWfkSJSBxiIRI8crJpVQ",
  authDomain: "audio-560a3.firebaseapp.com",
  databaseURL: "https://audio-560a3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "audio-560a3",
  storageBucket: "audio-560a3.firebasestorage.app",
  messagingSenderId: "674545099107",
  appId: "1:674545099107:web:a6db041e9f8d5797503356",
  measurementId: "G-FGK29251HM",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Thông báo mới';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/vite.svg',
    image: payload.notification?.image,
    badge: '/vite.svg',
    tag: payload.data?.notificationId || 'default',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Handle navigation if data contains URL
  if (event.notification.data?.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default: focus on existing window or open new one
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If there's an existing window, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

