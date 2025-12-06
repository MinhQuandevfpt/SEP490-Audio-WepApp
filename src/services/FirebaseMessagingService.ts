/**
 * Firebase Cloud Messaging Service
 * Handles FCM token registration, refresh, and message receiving
 */

import { messaging, getToken, onMessage } from '../config/firebase';
import { DeviceTokenService } from './DeviceTokenService';
import type { MessagePayload } from 'firebase/messaging';

// VAPID key - This should be provided by backend or Firebase Console
// For now, using a placeholder - backend should provide this
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
}

class FirebaseMessagingServiceClass {
  private currentToken: string | null = null;
  private tokenRefreshCallbacks: Array<(token: string) => void> = [];
  private messageCallbacks: Array<(payload: NotificationPayload) => void> = [];

  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Wait for service worker to be ready
   */
  private async waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      // Check if service worker is already registered
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.warn('Service worker not ready, waiting...', error);
      // Wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const registration = await navigator.serviceWorker.ready;
        return registration;
      } catch (err) {
        console.error('Service worker still not ready:', err);
        return null;
      }
    }
  }

  /**
   * Get FCM token for current device
   */
  async getFCMToken(): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase Messaging is not initialized');
      return null;
    }

    if (!this.isSupported()) {
      console.warn('Notifications are not supported');
      return null;
    }

    try {
      // Check permission first
      const permission = this.getPermissionStatus();
      if (permission !== 'granted') {
        console.log('Notification permission not granted:', permission);
        return null;
      }

      // Wait for service worker to be ready
      const registration = await this.waitForServiceWorker();
      if (!registration) {
        console.warn('Service worker not available, cannot get FCM token');
        return null;
      }

      // Prepare token options
      const tokenOptions: { vapidKey?: string } = {};
      if (VAPID_KEY && VAPID_KEY.trim() !== '') {
        tokenOptions.vapidKey = VAPID_KEY;
      }

      // Get token
      const token = await getToken(messaging, tokenOptions);

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        this.currentToken = token;
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error: any) {
      console.error('Error getting FCM token:', error);
      
      // Handle specific errors
      if (error.code === 'messaging/permission-blocked') {
        console.warn('Notification permission is blocked');
      } else if (error.code === 'messaging/permission-default') {
        console.warn('Notification permission is default (not requested)');
      } else if (error.code === 'messaging/failed-service-worker-registration') {
        console.warn('Service worker registration failed:', error.message);
      } else if (error.code === 'messaging/unsupported-browser') {
        console.warn('Browser does not support FCM');
      } else {
        console.error('Unknown FCM error:', error.code, error.message);
      }
      
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token: string, userType: 'CUSTOMER' | 'STOREOWNER'): Promise<boolean> {
    try {
      await DeviceTokenService.registerToken(token, userType);
      console.log('✅ FCM token registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to register FCM token:', error);
      return false;
    }
  }

  /**
   * Initialize FCM and register token
   * This should be called when user logs in
   */
  async initialize(userType: 'CUSTOMER' | 'STOREOWNER'): Promise<string | null> {
    if (!this.isSupported()) {
      console.warn('FCM not supported in this browser');
      return null;
    }

    try {
      // Ensure service worker is registered first
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (error) {
          console.warn('Service worker not ready, attempting to register...');
          // Service worker registration is handled in main.tsx
          // Wait a bit for it to be ready
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Request permission if not already granted
      const permission = this.getPermissionStatus();
      if (permission === 'default') {
        const newPermission = await this.requestPermission();
        if (newPermission !== 'granted') {
          console.log('User denied notification permission');
          return null;
        }
      } else if (permission !== 'granted') {
        console.log('Notification permission not granted:', permission);
        return null;
      }

      // Get FCM token
      const token = await this.getFCMToken();
      if (!token) {
        console.warn('Failed to get FCM token');
        return null;
      }

      // Register token with backend
      const registered = await this.registerToken(token, userType);
      if (!registered) {
        console.warn('Failed to register token with backend');
        return token; // Return token anyway, might retry later
      }

      // Set up message listener for foreground messages
      this.setupMessageListener();

      return token;
    } catch (error: any) {
      console.error('Error initializing FCM:', error);
      // Provide more detailed error information
      if (error.code) {
        console.error('FCM Error code:', error.code);
      }
      if (error.message) {
        console.error('FCM Error message:', error.message);
      }
      return null;
    }
  }

  /**
   * Set up listener for foreground messages
   */
  private setupMessageListener(): void {
    if (!messaging) return;

    try {
      onMessage(messaging, (payload: MessagePayload) => {
        console.log('📨 Foreground message received:', payload);
        
        const notificationPayload: NotificationPayload = {
          title: payload.notification?.title || 'Thông báo mới',
          body: payload.notification?.body || '',
          icon: payload.notification?.icon,
          image: payload.notification?.image,
          data: payload.data as Record<string, any>,
        };

        // Notify all registered callbacks
        this.messageCallbacks.forEach((callback) => {
          try {
            callback(notificationPayload);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });

        // Show browser notification if app is in foreground
        if (this.getPermissionStatus() === 'granted') {
          this.showBrowserNotification(notificationPayload);
        }
      });
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(payload: NotificationPayload): void {
    if (!this.isSupported() || this.getPermissionStatus() !== 'granted') {
      return;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/vite.svg',
        badge: '/vite.svg',
        tag: payload.data?.notificationId || 'default',
        data: payload.data,
      };

      // Add image if provided (some browsers support it)
      if (payload.image) {
        (notificationOptions as any).image = payload.image;
      }

      const notification = new Notification(payload.title, notificationOptions);

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle navigation if data contains URL
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
        
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Register callback for token refresh
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    this.tokenRefreshCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.tokenRefreshCallbacks.indexOf(callback);
      if (index > -1) {
        this.tokenRefreshCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback: (payload: NotificationPayload) => void): () => void {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Clean up - remove all listeners
   */
  cleanup(): void {
    this.tokenRefreshCallbacks = [];
    this.messageCallbacks = [];
    this.currentToken = null;
  }
}

export const FirebaseMessagingService = new FirebaseMessagingServiceClass();

