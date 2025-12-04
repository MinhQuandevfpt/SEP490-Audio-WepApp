import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  metadataJson: string | null;
  createdAt: string | null;
}

export interface NotificationPageResponse {
  content: Notification[];
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

export class NotificationService {
  /**
   * Get customer notifications with pagination
   * GET /api/customer/notifications?page=0&size=20
   */
  static async getNotifications(page: number = 0, size: number = 20): Promise<NotificationPageResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
      });

      const url = `${API_URL}/customer/notifications?${queryParams.toString()}`;
      const data = await HttpInterceptor.get<NotificationPageResponse>(url, {
        headers: { 'Accept': 'application/json' },
        userType: 'customer',
      });

      return data;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * POST /api/customer/notifications/{id}/read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const url = `${API_URL}/customer/notifications/${notificationId}/read`;
      await HttpInterceptor.post(url, {}, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        userType: 'customer',
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * GET /api/customer/notifications/unread-count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const url = `${API_URL}/customer/notifications/unread-count`;
      const data = await HttpInterceptor.get<number>(url, {
        headers: { 'Accept': 'application/json' },
        userType: 'customer',
      });

      if (typeof data === 'number') {
        return data;
      }

      if (typeof (data as any)?.count === 'number') {
        return (data as any).count;
      }

      return Number(data) || 0;
    } catch (error) {
      console.error('❌ Error fetching unread notification count:', error);
      throw error;
    }
  }
}

export default NotificationService;

