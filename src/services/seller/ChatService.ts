import HttpInterceptor from '../HttpInterceptor';

export interface MediaItem {
  url: string;
  type?: string; // 'image' | 'video'
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'STORE';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  mediaUrl?: string | MediaItem[]; // Support both old format (string) and new format (array)
  timestamp?: string;
  createdAt?: string;
}

export interface SendMessageRequest {
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  mediaUrl?: string | MediaItem[]; // Support both old format (string) and new format (array)
}

export interface GetMessagesResponse {
  data: ChatMessage[];
  page?: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName?: string;
  storeId: string;
  storeName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

export interface ConversationsResponse {
  data?: Conversation[];
}

export class SellerChatService {
  private static readonly BASE_URL = '/api/chat';

  /**
   * Get messages between customer and store (seller view)
   */
  static async getMessages(
    customerId: string,
    storeId: string,
    limit?: number
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/messages${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    
    const response = await HttpInterceptor.get<any>(endpoint, {
      userType: 'seller',
    });

    // Backend might return data directly or wrapped in data property
    if (Array.isArray(response)) {
      return { data: response };
    }
    
    return response;
  }

  /**
   * Send message to customer (seller view)
   */
  static async sendMessage(
    customerId: string,
    storeId: string,
    request: SendMessageRequest
  ): Promise<ChatMessage> {
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/messages`;
    
    return await HttpInterceptor.post<ChatMessage>(endpoint, request, {
      userType: 'seller',
    });
  }

  /**
   * Get all conversations for a store
   */
  static async getConversations(storeId: string): Promise<Conversation[]> {
    const endpoint = `${this.BASE_URL}/stores/${storeId}/conversations`;
    
    const response = await HttpInterceptor.get<any>(endpoint, {
      userType: 'seller',
    });

    // Backend returns array directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Or might be wrapped in data property
    return response.data || [];
  }

  /**
   * Get current store ID from cache
   */
  static async getStoreId(): Promise<string> {
    // Import StoreService dynamically to get storeId
    const { StoreService } = await import('./StoreService');
    return await StoreService.getStoreId();
  }
}

export default SellerChatService;

