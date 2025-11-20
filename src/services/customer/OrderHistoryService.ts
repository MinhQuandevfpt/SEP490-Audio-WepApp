/**
 * Order History Service
 * Handles customer order history operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type {
  OrderHistoryResponse,
  OrderHistoryRequest,
  CustomerOrder,
} from '../../types/api';
import { getCustomerId } from '../../utils/authHelper';

export class OrderHistoryService {
  /**
   * Get customer ID from localStorage (using authHelper)
   */
  private static getCustomerId(): string {
    const customerId = getCustomerId();
    if (!customerId) {
      throw new Error('Customer ID not found. Please login again.');
    }
    return customerId;
  }

  /**
   * Get order history with pagination and filters
   * GET /api/customers/{customerId}/orders?page=0&size=20
   */
  static async list(params?: OrderHistoryRequest): Promise<{
    data: CustomerOrder[];
    total: number;
    totalPages: number;
    page: number;
    size: number;
  }> {
    try {
      const customerId = this.getCustomerId();
      const page = params?.page ?? 0;  // Backend uses 0-based indexing
      const size = params?.size ?? 20;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(size));
      
      if (params?.status) {
        queryParams.append('status', params.status);
      }

      // Note: Search might need to be handled on backend or client-side
      // For now, we'll filter client-side if search is provided

      const endpoint = `/api/customers/${customerId}/orders?${queryParams.toString()}`;
      
      const response = await HttpInterceptor.get<OrderHistoryResponse>(
        endpoint,
        { userType: 'customer' }
      );

      let filteredItems = response.items || [];

      // Client-side search by order ID or external order code
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredItems = filteredItems.filter(order => 
          order.id.toLowerCase().includes(searchTerm) ||
          (order.externalOrderCode && order.externalOrderCode.toLowerCase().includes(searchTerm))
        );
      }

      return {
        data: filteredItems,
        total: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        page: response.page || 0,
        size: response.size || size,
      };
    } catch (error: any) {
      console.error('❌ Error fetching order history:', error);
      throw new Error(error?.message || 'Không thể tải danh sách đơn hàng');
    }
  }

  /**
   * Get order detail by order ID
   * GET /api/customers/{customerId}/orders/{orderId}
   */
  static async getById(orderId: string): Promise<CustomerOrder | null> {
    try {
      const customerId = this.getCustomerId();
      const endpoint = `/api/customers/${customerId}/orders/${orderId}`;
      
      const response = await HttpInterceptor.get<CustomerOrder | { status: number; message: string; data: CustomerOrder }>(
        endpoint,
        { userType: 'customer' }
      );

      if (response && typeof response === 'object' && 'data' in response) {
        return (response as { data: CustomerOrder }).data;
      }

      return response as CustomerOrder;
    } catch (error: any) {
      console.error('❌ Error fetching order detail:', error);
      if (error?.status === 404) {
        return null;
      }
      throw new Error(error?.message || 'Không thể tải chi tiết đơn hàng');
    }
  }

  /**
   * Get order by external order code (PayOS code)
   * Helper method to find order by external code
   */
  static async getByExternalCode(externalCode: string): Promise<CustomerOrder | null> {
    try {
      // Since backend might not have this endpoint, we'll search in recent orders
      const response = await this.list({ size: 100 });
      const order = response.data.find(o => o.externalOrderCode === externalCode);
      return order || null;
    } catch (error: any) {
      console.error('❌ Error finding order by external code:', error);
      return null;
    }
  }

  /**
   * Cancel a customer order while status is PENDING
   * POST /api/v1/customers/{customerId}/orders/{orderId}/cancel?reason=...&note=...
   */
  static async cancel(orderId: string, reason: string, note?: string): Promise<void> {
    try {
      const customerId = this.getCustomerId();
      const query = new URLSearchParams();
      query.append('reason', reason);
      if (note) {
        query.append('note', note);
      }

      const endpoint = `/api/v1/customers/${customerId}/orders/${orderId}/cancel?${query.toString()}`;

      await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'customer' });
    } catch (error: any) {
      // Re-throw with message so UI can show server response
      throw new Error(error?.message || 'Không thể hủy đơn hàng');
    }
  }

  /**
   * Request cancellation for a customer order while status is AWAITING_SHIPMENT
   * POST /api/v1/customers/{customerId}/orders/{customerOrderId}/cancel-request?reason=...&note=...
   * Creates a cancellation request for shop approval
   */
  static async requestCancel(orderId: string, reason: string, note?: string): Promise<void> {
    try {
      const customerId = this.getCustomerId();
      const query = new URLSearchParams();
      query.append('reason', reason);
      if (note) {
        query.append('note', note);
      }

      const endpoint = `/api/v1/customers/${customerId}/orders/${orderId}/cancel-request?${query.toString()}`;

      await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'customer' });
    } catch (error: any) {
      // Re-throw with message so UI can show server response
      throw new Error(error?.message || 'Không thể gửi yêu cầu hủy đơn hàng');
    }
  }

  /**
   * Get GHN order by store order ID (for customer)
   * GET /api/v1/ghn-orders/by-store-order/{storeOrderId}
   * Returns null if GHN order not found (404/500) - this is normal for orders without GHN tracking
   */
  static async getGhnOrderByStoreOrderId(storeOrderId: string): Promise<any | null> {
    try {
      const response = await HttpInterceptor.get<any>(
        `/api/v1/ghn-orders/by-store-order/${storeOrderId}`,
        { userType: 'customer' }
      );
      return response;
    } catch (error: any) {
      // Return null for 404 or 500 - this is normal when order doesn't have GHN tracking yet
      // Don't log errors for "not found" cases as they're expected
      if (error?.status === 404 || error?.status === 500) {
        return null;
      }
      // Only log unexpected errors (network issues, auth errors, etc.)
      console.error('Failed to get GHN order:', error);
      return null; // Return null instead of throwing to prevent UI errors
    }
  }
}

export default OrderHistoryService;


