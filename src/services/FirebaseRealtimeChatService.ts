import { database } from '../config/firebase';
import { ref, onValue, off, set, push, query, orderByChild, limitToLast, get } from 'firebase/database';

export interface MediaItem {
  url: string;
  type?: string; // 'image' | 'video'
}

export interface FirebaseChatMessage {
  id: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'STORE';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  mediaUrl?: string | MediaItem[]; // Support both string (old format) and array (new format)
  createdAt: string | number;
  timestamp?: number;
  read?: boolean; // Message read status
}

class FirebaseRealtimeChatService {
  /**
   * Get chat reference path
   */
  private getChatPath(customerId: string, storeId: string): string {
    return `chats/${customerId}_${storeId}/messages`;
  }

  /**
   * Listen to new messages in realtime
   * @param customerId - Customer ID
   * @param storeId - Store ID
   * @param onNewMessages - Callback when messages change
   * @returns Unsubscribe function
   */
  subscribeToMessages(
    customerId: string,
    storeId: string,
    onNewMessages: (messages: FirebaseChatMessage[]) => void
  ): () => void {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = ref(database, chatPath);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));

    onValue(messagesQuery, (snapshot) => {
      const messages: FirebaseChatMessage[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          messages.push({
            id: childSnapshot.key || data.id,
            senderId: data.senderId,
            senderType: data.senderType,
            content: data.content,
            messageType: data.messageType || 'TEXT',
            mediaUrl: data.mediaUrl,
            createdAt: data.createdAt || data.timestamp,
            timestamp: data.timestamp,
            read: data.read !== undefined ? data.read : false, // Default to false if not provided
          });
        });
      }
      
      onNewMessages(messages);
    });

    // Return unsubscribe function
    return () => {
      off(messagesQuery);
    };
  }

  /**
   * Send a message to Firebase
   * @param customerId - Customer ID
   * @param storeId - Store ID
   * @param message - Message data
   */
  async sendMessage(
    customerId: string,
    storeId: string,
    message: {
      senderId: string;
      senderType: 'CUSTOMER' | 'STORE';
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
      mediaUrl?: string | MediaItem[]; // Support both string and array
      read?: boolean; // Message read status
    }
  ): Promise<void> {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = ref(database, chatPath);
    const newMessageRef = push(messagesRef);

    const messageData: any = {
      id: newMessageRef.key,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType || 'TEXT',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      read: message.read !== undefined ? message.read : false, // Default to false
    };

    // Only add mediaUrl if it exists and is not undefined
    if (message.mediaUrl) {
      messageData.mediaUrl = message.mediaUrl;
    }

    await set(newMessageRef, messageData);
  }

  /**
   * Get all messages once (without subscription)
   * @param customerId - Customer ID
   * @param storeId - Store ID
   */
  async getMessages(
    customerId: string,
    storeId: string
  ): Promise<FirebaseChatMessage[]> {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = ref(database, chatPath);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));

    const snapshot = await get(messagesQuery);
    const messages: FirebaseChatMessage[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          id: childSnapshot.key || data.id,
          senderId: data.senderId,
          senderType: data.senderType,
          content: data.content,
          messageType: data.messageType || 'TEXT',
          mediaUrl: data.mediaUrl,
          createdAt: data.createdAt || data.timestamp,
          timestamp: data.timestamp,
        });
      });
    }

    return messages;
  }

  /**
   * Update read status for all messages from a specific sender
   * @param customerId - Customer ID
   * @param storeId - Store ID
   * @param senderType - Sender type to mark as read ('CUSTOMER' or 'STORE')
   */
  async updateMessagesReadStatus(
    customerId: string,
    storeId: string,
    senderType: 'CUSTOMER' | 'STORE'
  ): Promise<void> {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = ref(database, chatPath);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    const snapshot = await get(messagesQuery);
    
    if (snapshot.exists()) {
      const updatePromises: Promise<void>[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Update read status for messages from the specified sender that are not yet read
        if (data.senderType === senderType && data.read !== true) {
          const messageRef = ref(database, `${chatPath}/${childSnapshot.key}/read`);
          updatePromises.push(set(messageRef, true));
        }
      });

      // Update all messages in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }
  }

  /**
   * Unsubscribe from a chat
   */
  unsubscribe(customerId: string, storeId: string): void {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = ref(database, chatPath);
    off(messagesRef);
  }
}

export default new FirebaseRealtimeChatService();
