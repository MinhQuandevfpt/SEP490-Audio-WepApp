import HttpInterceptor from '../HttpInterceptor';
import { getCustomerId } from '../../utils/authHelper';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'STORE';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  mediaUrl?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface SendMessageRequest {
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
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
  unreadCount?: number;
}

export class ChatService {
  private static readonly BASE_URL = '/api/chat';

  /**
   * Get messages between customer and store
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
      userType: 'customer',
    });

    // Backend might return data directly or wrapped in data property
    if (Array.isArray(response)) {
      return { data: response };
    }
    
    return response;
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
}

export default ChatService;

