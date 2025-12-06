/**
 * Firebase Messaging Provider Component
 * Automatically initializes FCM when user is logged in
 */

import { useEffect } from 'react';
import { useFirebaseMessaging } from '../../hooks/useFirebaseMessaging';
import { message } from 'antd';
import type { NotificationPayload } from '../../services/FirebaseMessagingService';

const FirebaseMessagingProvider: React.FC = () => {
  const { isSupported, permission, error } = useFirebaseMessaging({
    autoInitialize: true,
    onNotification: (payload: NotificationPayload) => {
      // Show Ant Design notification
      message.info({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{payload.title}</div>
            <div>{payload.body}</div>
          </div>
        ),
        duration: 5,
        onClick: () => {
          // Handle navigation if data contains URL
          if (payload.data?.url) {
            window.location.href = payload.data.url;
          }
        },
      });

      console.log('📨 Notification received:', payload);
    },
  });

  // Log initialization status
  useEffect(() => {
    if (!isSupported) {
      console.log('🔕 FCM not supported in this browser');
      return;
    }

    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
    } else if (permission === 'denied') {
      console.log('❌ Notification permission denied');
    } else {
      console.log('⏳ Notification permission not requested yet');
    }
  }, [isSupported, permission]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('FCM Error:', error);
    }
  }, [error]);

  // This component doesn't render anything
  return null;
};

export default FirebaseMessagingProvider;

