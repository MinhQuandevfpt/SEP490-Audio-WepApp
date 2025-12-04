import { firestore } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  writeBatch
} from 'firebase/firestore';

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

class FirestoreChatService {
  /**
   * Get chat collection reference path
   */
  private getChatPath(customerId: string, storeId: string): string {
    return `chats/${customerId}_${storeId}`;
  }

  /**
   * Listen to new messages in realtime using Firestore
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
    const messagesRef = collection(firestore, chatPath, 'messages');
    const messagesQuery = query(
      messagesRef, 
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: FirebaseChatMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          senderType: data.senderType,
          content: data.content || '',
          messageType: data.messageType || 'TEXT',
          mediaUrl: data.mediaUrl,
          createdAt: data.createdAt || data.timestamp,
          timestamp: data.timestamp,
          read: data.read !== undefined ? data.read : false,
        });
      });
      
      onNewMessages(messages);
    });

    return unsubscribe;
  }

  /**
   * Send a message to Firestore
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
      mediaUrl?: string | MediaItem[];
      read?: boolean;
    }
  ): Promise<void> {
    const chatPath = this.getChatPath(customerId, storeId);
    const messagesRef = collection(firestore, chatPath, 'messages');
    const newMessageRef = doc(messagesRef);

    const timestamp = Date.now();
    const messageData: any = {
      id: newMessageRef.id,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      messageType: message.messageType || 'TEXT',
      createdAt: new Date().toISOString(),
      timestamp: timestamp,
      read: message.read !== undefined ? message.read : false,
    };

    // Only add mediaUrl if it exists and is not undefined
    if (message.mediaUrl) {
      messageData.mediaUrl = message.mediaUrl;
    }

    await setDoc(newMessageRef, messageData);
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
    const messagesRef = collection(firestore, chatPath, 'messages');
    const messagesQuery = query(
      messagesRef, 
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages: FirebaseChatMessage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content || '',
        messageType: data.messageType || 'TEXT',
        mediaUrl: data.mediaUrl,
        createdAt: data.createdAt || data.timestamp,
        timestamp: data.timestamp,
        read: data.read !== undefined ? data.read : false,
      });
    });

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
    const messagesRef = collection(firestore, chatPath, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('senderType', '==', senderType),
      where('read', '==', false)
    );

    const snapshot = await getDocs(messagesQuery);
    
    if (!snapshot.empty) {
      const batch = writeBatch(firestore);
      
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    }
  }

  /**
   * Unsubscribe - no-op for Firestore (handled by returned unsubscribe function)
   */
  unsubscribe(_customerId: string, _storeId: string): void {
    // No-op: Firestore unsubscribe is handled by the function returned from onSnapshot
  }
}

export default new FirestoreChatService();
