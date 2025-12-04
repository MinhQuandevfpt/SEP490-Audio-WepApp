import HttpInterceptor from '../HttpInterceptor';
import { getCustomerId } from '../../utils/authHelper';

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

export interface CustomerConversation {
  id: string;
  customerId: string;
  storeId: string;
  storeName?: string;
  lastMessage: string;
  lastMessageTime: string;
  customerUnreadCount?: number;
  storeUnreadCount?: number;
  unreadCount?: number; // For backward compatibility
}

export class ChatService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    return baseUrl.endsWith('/api') ? `${baseUrl}/chat` : `${baseUrl}/api/chat`;
  }

  /**
   * Get messages between customer and store
   */
  static async getMessages(
    customerId: string,
    storeId: string,
    limit?: number
  ): Promise<GetMessagesResponse> {
    const params = new URLSearchParams();
    // Required parameter: viewerType must be CUSTOMER for customer
    params.append('viewerType', 'CUSTOMER');
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/messages?${params.toString()}`;
    
    const response = await HttpInterceptor.get<any>(endpoint, {
      userType: 'customer',
    });

    // API returns array directly
    if (Array.isArray(response)) {
      return { data: response };
    }
    
    // If response has data property (fallback)
    if (response?.data) {
      return response;
    }
    
    return { data: [] };
  }

  /**
   * Send message to store
   */
  static async sendMessage(
    customerId: string,
    storeId: string,
    request: SendMessageRequest
  ): Promise<ChatMessage> {
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/messages`;
    
    return await HttpInterceptor.post<ChatMessage>(endpoint, request, {
      userType: 'customer',
    });
  }

  /**
   * Get all conversations for a customer
   */
  static async getCustomerConversations(customerId: string): Promise<CustomerConversation[]> {
    const endpoint = `${this.BASE_URL}/customers/${customerId}/conversations`;
    
    const response = await HttpInterceptor.get<any>(endpoint, {
      userType: 'customer',
    });

    // Backend returns array directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Or might be wrapped in data property
    return response.data || [];
  }

  /**
   * Get current user ID from auth
   * Uses authHelper to get customerId from localStorage
   */
  static getCurrentUserId(): string | null {
    const customerId = getCustomerId();
    
    if (customerId) {
      console.log('✅ Customer ID found:', customerId);
      return customerId;
    }
    
    console.warn('⚠️ Customer ID not found in localStorage');
    return null;
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(
    customerId: string,
    storeId: string,
    viewerId: string
  ): Promise<void> {
    const endpoint = `${this.BASE_URL}/conversations/${customerId}/${storeId}/read?viewerId=${viewerId}`;
    
    await HttpInterceptor.post(endpoint, {}, {
      userType: 'customer',
    });
  }
}

export default ChatService;

