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
  read?: boolean; // Message read status
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
  customerUnreadCount?: number;
  storeUnreadCount?: number;
  unreadCount?: number; // For backward compatibility
}

export interface ConversationsResponse {
  data?: Conversation[];
}

export class SellerChatService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    return baseUrl.endsWith('/api') ? `${baseUrl}/chat` : `${baseUrl}/api/chat`;
  }

  /**
   * Get messages between customer and store (seller view)
   */
  static async getMessages(
    customerId: string,
    storeId: string,
    limit?: number
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    // Required parameter: viewerType must be STORE for seller
    params.append('viewerType', 'STORE');
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/messages?${params.toString()}`;
    
    console.log('🔍 Fetching messages from:', endpoint);
    
    const response = await HttpInterceptor.get<any>(endpoint, {
      userType: 'seller',
    });

    console.log('📥 Raw messages response:', response);

    // API returns array directly
    if (Array.isArray(response)) {
      console.log('✅ Response is array, length:', response.length);
      return { data: response };
    }
    
    // If response has data property (fallback)
    if (response?.data) {
      console.log('✅ Response has data property, length:', Array.isArray(response.data) ? response.data.length : 'not array');
      return response;
    }
    
    // If response structure is different, return empty array
    console.warn('⚠️ Unexpected response structure, returning empty array');
    return { data: [] };
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

  /**
   * Mark messages as read
   * POST /api/chat/conversations/{customerId}/{storeId}/read?viewerId={viewerId}
   */
  static async markAsRead(
    customerId: string,
    storeId: string,
    viewerId: string
  ): Promise<void> {
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/read?viewerId=${viewerId}`;
    
    console.log('✅ Marking messages as read:', { customerId, storeId, viewerId });
    
    await HttpInterceptor.post(endpoint, {}, {
      userType: 'seller',
    });
  }
}

export default SellerChatService;

