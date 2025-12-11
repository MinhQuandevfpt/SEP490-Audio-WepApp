import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  metadataJson: string | null;
  createdAt: string;
}

export interface StoreNotificationPageResponse {
  content: StoreNotification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export class NotificationService {
  /**
   * Get store notifications with pagination and search
   * GET /api/store/notifications?keyword=a&page=0&size=20
   */
  static async getNotifications(
    page: number = 0, 
    size: number = 20, 
    keyword?: string
  ): Promise<StoreNotificationPageResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
      });

      // Add keyword if provided
      if (keyword && keyword.trim()) {
        queryParams.append('keyword', keyword.trim());
      }

      const url = `${API_URL}/store/notifications?${queryParams.toString()}`;
      const response = await HttpInterceptor.get<StoreNotificationPageResponse | { data: StoreNotificationPageResponse }>(url, {
        headers: { 'Accept': '*/*' },
        userType: 'seller',
      });

      // Handle both wrapped and unwrapped responses
      if (response && 'data' in response && response.data) {
        return response.data;
      }
      
      return response as StoreNotificationPageResponse;
    } catch (error) {
      console.error('❌ Error fetching store notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * GET /api/store/notifications/unread-count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const url = `${API_URL}/store/notifications/unread-count`;
      const response = await HttpInterceptor.get<UnreadCountResponse | { data: UnreadCountResponse }>(url, {
        headers: { 'Accept': '*/*' },
        userType: 'seller',
      });

      // Handle both wrapped and unwrapped responses
      if (response && 'data' in response && response.data) {
        return response.data.unreadCount || 0;
      }
      
      return (response as UnreadCountResponse).unreadCount || 0;
    } catch (error) {
      console.error('❌ Error fetching unread notification count:', error);
      // Return 0 on error instead of throwing
      return 0;
    }
  }

  /**
   * Mark notification as read
   * POST /api/store/notifications/{id}/read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const url = `${API_URL}/store/notifications/${notificationId}/read`;
      await HttpInterceptor.post(url, {}, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        userType: 'seller',
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }
}

export default NotificationService;

