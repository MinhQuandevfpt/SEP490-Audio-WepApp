/**
 * React Hook for Firebase Cloud Messaging
 * Handles FCM token registration and message receiving
 */

import { useEffect, useState, useCallback } from 'react';
import { FirebaseMessagingService } from '../services/FirebaseMessagingService';
import type { NotificationPayload } from '../services/FirebaseMessagingService';
import { getUserInfo, type UserType as AuthUserType } from '../utils/authHelper';

export type UserType = 'CUSTOMER' | 'STOREOWNER';

interface UseFirebaseMessagingOptions {
  /**
   * Auto-initialize when user is logged in
   * Default: true
   */
  autoInitialize?: boolean;
  
  /**
   * User type - if not provided, will try to detect from localStorage
   */
  userType?: UserType;
  
  /**
   * Callback when a notification is received
   */
  onNotification?: (payload: NotificationPayload) => void;
}

interface UseFirebaseMessagingReturn {
  /**
   * Current FCM token
   */
  token: string | null;
  
  /**
   * Whether FCM is supported
   */
  isSupported: boolean;
  
  /**
   * Current permission status
   */
  permission: NotificationPermission;
  
  /**
   * Whether FCM is initialized
   */
  isInitialized: boolean;
  
  /**
   * Error message if any
   */
  error: string | null;
  
  /**
   * Manually initialize FCM
   */
  initialize: (userType?: UserType) => Promise<string | null>;
  
  /**
   * Request notification permission
   */
  requestPermission: () => Promise<NotificationPermission>;
  
  /**
   * Clean up listeners
   */
  cleanup: () => void;
}

/**
 * Hook to use Firebase Cloud Messaging
 */
export function useFirebaseMessaging(
  options: UseFirebaseMessagingOptions = {}
): UseFirebaseMessagingReturn {
  const {
    autoInitialize = true,
    userType: providedUserType,
    onNotification,
  } = options;

  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Detect user type from localStorage
   */
  const detectUserType = useCallback((): UserType | null => {
    if (providedUserType) {
      return providedUserType;
    }

    // Check if customer is logged in
    const customerUser = getUserInfo('CUSTOMER' as AuthUserType);
    if (customerUser) {
      return 'CUSTOMER';
    }

    // Check if seller is logged in
    const sellerUser = getUserInfo('STOREOWNER' as AuthUserType);
    if (sellerUser) {
      return 'STOREOWNER';
    }

    return null;
  }, [providedUserType]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    const detectedType = detectUserType();
    if (!detectedType) return false;

    // Check if access token exists in localStorage
    if (detectedType === 'CUSTOMER') {
      return !!localStorage.getItem('CUSTOMER_token');
    } else if (detectedType === 'STOREOWNER') {
      return !!localStorage.getItem('STOREOWNER_token');
    }

    return false;
  }, [detectUserType]);

  /**
   * Initialize FCM
   */
  const initialize = useCallback(async (userType?: UserType): Promise<string | null> => {
    try {
      setError(null);

      if (!FirebaseMessagingService.isSupported()) {
        setError('Notifications are not supported in this browser');
        return null;
      }

      const detectedType = userType || detectUserType();
      if (!detectedType) {
        setError('User type not detected. Please login first.');
        return null;
      }

      // Check if user is authenticated
      if (!isAuthenticated()) {
        setError('User is not authenticated');
        return null;
      }

      // Update permission status
      const currentPermission = FirebaseMessagingService.getPermissionStatus();
      setPermission(currentPermission);

      // Initialize FCM
      const fcmToken = await FirebaseMessagingService.initialize(detectedType);
      
      if (fcmToken) {
        setToken(fcmToken);
        setIsInitialized(true);
        console.log('✅ FCM initialized successfully');
        return fcmToken;
      } else {
        // Don't set error if permission was denied - that's user choice
        const currentPermission = FirebaseMessagingService.getPermissionStatus();
        if (currentPermission === 'denied') {
          setError('Notification permission denied by user');
        } else if (currentPermission === 'default') {
          setError('Notification permission not requested');
        } else {
          setError('Failed to get FCM token. Please check service worker registration.');
        }
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.code || 'Failed to initialize FCM';
      setError(errorMessage);
      console.error('Error initializing FCM:', err);
      if (err.code) {
        console.error('FCM Error code:', err.code);
      }
      return null;
    }
  }, [detectUserType, isAuthenticated]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await FirebaseMessagingService.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (err: any) {
      console.error('Error requesting permission:', err);
      setPermission('denied');
      return 'denied';
    }
  }, []);

  /**
   * Clean up
   */
  const cleanup = useCallback(() => {
    FirebaseMessagingService.cleanup();
    setToken(null);
    setIsInitialized(false);
    setError(null);
  }, []);

  // Auto-initialize when component mounts and user is logged in
  useEffect(() => {
    if (!autoInitialize) return;

    // Check if user is authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping FCM initialization');
      return;
    }

    // Initialize FCM
    initialize().catch((err) => {
      console.error('Auto-initialize FCM failed:', err);
    });

    // Cleanup on unmount
    return () => {
      // Don't cleanup token, just remove listeners
      // Token should persist across component unmounts
    };
  }, [autoInitialize, isAuthenticated, initialize]);

  // Set up message listener
  useEffect(() => {
    if (!onNotification) return;

    const unsubscribe = FirebaseMessagingService.onMessage((payload) => {
      onNotification(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [onNotification]);

  // Update permission status periodically
  useEffect(() => {
    if (!FirebaseMessagingService.isSupported()) return;

    const updatePermission = () => {
      const currentPermission = FirebaseMessagingService.getPermissionStatus();
      setPermission(currentPermission);
    };

    // Update immediately
    updatePermission();

    // Update every 5 seconds (in case user changes permission in browser settings)
    const interval = setInterval(updatePermission, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    token,
    isSupported: FirebaseMessagingService.isSupported(),
    permission,
    isInitialized,
    error,
    initialize,
    requestPermission,
    cleanup,
  };
}

