/**
 * Store Order Service
 * Handles store order management for sellers
 */

import { HttpInterceptor } from '../HttpInterceptor';
import { StoreService } from './StoreService';
import type {
  StoreOrdersResponse,
  StoreOrdersRequest,
  StoreOrder,
  AssignDeliveryStaffRequest,
  AssignDeliveryStaffResponse
} from '../../types/seller';
import type { ApiResponse, CustomerAddressApiItem } from '../../types/api';

export class StoreOrderService {
  /**
   * Get store ID from cache or API
   */
  private static async getStoreId(): Promise<string> {
    const cachedId = localStorage.getItem('seller_store_id');
    if (cachedId) {
      return cachedId;
    }
    
    // Fetch store ID from API
    const storeId = await StoreService.getStoreId();
    return storeId;
  }

  /**
   * Get store orders with pagination and filters
   * GET /api/v1/stores/{storeId}/orders?page=0&size=50
   */
  static async getOrders(params?: StoreOrdersRequest): Promise<{
    data: StoreOrder[];
    total: number;
    totalPages: number;
    page: number;
    size: number;
  }> {
    try {
      const storeId = await this.getStoreId();
      const page = params?.page ?? 0;  // Backend uses 0-based indexing
      const size = params?.size ?? 20;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('size', String(size));
      
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.orderCodeKeyword) {
        queryParams.append('orderCodeKeyword', params.orderCodeKeyword);
      }
      if (params?.fromDate) {
        queryParams.append('fromDate', params.fromDate);
      }
      if (params?.toDate) {
        queryParams.append('toDate', params.toDate);
      }

      const endpoint = `/api/v1/stores/${storeId}/orders?${queryParams.toString()}`;
      
      const response = await HttpInterceptor.get<StoreOrdersResponse>(
        endpoint,
        { userType: 'seller' }
      );

      let filteredItems = response.items || [];

      // Client-side search by order code, order ID, customer name, or phone
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredItems = filteredItems.filter(order => 
          (order.orderCode && order.orderCode.toLowerCase().includes(searchTerm)) ||
          order.id.toLowerCase().includes(searchTerm) ||
          order.customerOrderId.toLowerCase().includes(searchTerm) ||
          order.customerName.toLowerCase().includes(searchTerm) ||
          order.customerPhone.toLowerCase().includes(searchTerm)
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
      console.error('❌ Error fetching store orders:', error);
      throw new Error(error?.message || 'Không thể tải danh sách đơn hàng');
    }
  }

  /**
   * Get order detail by order ID
   * GET /api/v1/stores/{storeId}/orders/{orderId}?storeId={storeId}
   */
  static async getOrderById(orderId: string): Promise<StoreOrder | null> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${orderId}?storeId=${storeId}`;
      
      const response = await HttpInterceptor.get<StoreOrder>(
        endpoint,
        { userType: 'seller' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error fetching order detail:', error);
      if (error?.status === 404) {
        return null;
      }
      throw new Error(error?.message || 'Không thể tải chi tiết đơn hàng');
    }
  }

  /**
   * Update order status
   * PATCH /api/v1/stores/{storeId}/orders/{orderId}/status
   */
  static async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<StoreOrder> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${orderId}/status`;
      
      const response = await HttpInterceptor.patch<StoreOrder>(
        endpoint,
        { status },
        { userType: 'seller' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);
      throw new Error(error?.message || 'Không thể cập nhật trạng thái đơn hàng');
    }
  }

  /**
   * Assign delivery staff to order
   * POST /api/v1/stores/{storeId}/orders/{storeOrderId}/delivery/assign
   */
  static async assignDeliveryStaff(
    storeOrderId: string,
    request: AssignDeliveryStaffRequest
  ): Promise<AssignDeliveryStaffResponse> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/delivery/assign`;
      
      console.log('📦 Assigning delivery staff:', { storeId, storeOrderId, request });

      const response = await HttpInterceptor.post<ApiResponse<StoreOrder>>(
        endpoint,
        {
          deliveryStaffId: request.deliveryStaffId,
          preparedByStaffId: request.preparedByStaffId || null,
          note: request.note || null,
        },
        { userType: 'seller' }
      );

      console.log('✅ Delivery staff assigned successfully');
      return {
        status: response.status || 200,
        message: response.message || 'Phân công nhân viên giao hàng thành công',
        data: response.data as StoreOrder,
      } as AssignDeliveryStaffResponse;
    } catch (error: any) {
      console.error('❌ Error assigning delivery staff:', error);
      throw new Error(error?.message || 'Không thể phân công nhân viên giao hàng');
    }
  }

  /**
   * Get cancellation requests for an order
   * GET /api/v1/stores/{storeId}/orders/{storeOrderId}/cancel-requests
   */
  static async getCancelRequests(storeOrderId: string): Promise<any[]> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/cancel-requests`;
      
      const response = await HttpInterceptor.get<{
        status: number;
        message: string;
        data: any[];
      }>(
        endpoint,
        { userType: 'seller' }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching cancel requests:', error);
      // Return empty array if 404 (no cancel requests found)
      if (error?.status === 404) {
        return [];
      }
      throw new Error(error?.message || 'Không thể tải danh sách yêu cầu hủy đơn hàng');
    }
  }

  /**
   * Approve cancellation request
   * POST /api/v1/stores/{storeId}/orders/{storeOrderId}/cancel/approve
   * 
   * Response format:
   * - Success (200): { status: 200, message: string, data: null }
   * - Error (400): { status: 400, message: string, data: null }
   * 
   * Note: HttpInterceptor will throw error for non-2xx status codes.
   * The error will have:
   * - error.message: message from API response
   * - error.status: HTTP status code (e.g., 400)
   * - error.data: full response body { status, message, data }
   */
  static async approveCancelRequest(storeOrderId: string): Promise<void> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/cancel/approve`;
      
      const response = await HttpInterceptor.post<{
        status: number;
        message: string;
        data: null;
      }>(
        endpoint,
        undefined,
        { userType: 'seller' }
      );

      // If we get here, the request was successful (status 200)
      console.log('✅ Cancel request approved:', response?.message || 'Yêu cầu hủy đơn hàng đã được chấp nhận');
    } catch (error: any) {
      console.error('❌ Error approving cancel request:', error);
      
      // HttpInterceptor throws error for non-2xx responses
      // The error already contains status and message from API
      // We just need to re-throw it so the caller can handle translation
      throw error;
    }
  }

  /**
   * Reject cancellation request
   * POST /api/v1/stores/{storeId}/orders/{storeOrderId}/cancel/reject?note=...
   */
  static async rejectCancelRequest(storeOrderId: string, note?: string): Promise<void> {
    try {
      const storeId = await this.getStoreId();
      let endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/cancel/reject`;
      
      // Add note as query parameter if provided
      if (note) {
        const queryParams = new URLSearchParams();
        queryParams.append('note', note);
        endpoint += `?${queryParams.toString()}`;
      }
      
      const response = await HttpInterceptor.post<{
        status: number;
        message: string;
        data: null;
      }>(
        endpoint,
        undefined,
        { userType: 'seller' }
      );

      console.log('✅ Cancel request rejected:', response.message);
    } catch (error: any) {
      console.error('❌ Error rejecting cancel request:', error);
      throw new Error(error?.message || 'Không thể từ chối yêu cầu hủy đơn hàng');
    }
  }

  /**
   * Get customer addresses by customer ID
   * GET /api/customers/{customerId}/addresses
   * Used by seller to get customer shipping address for GHN transfer
   */
  static async getCustomerAddresses(customerId: string): Promise<CustomerAddressApiItem[]> {
    try {
      const endpoint = `/api/customers/${customerId}/addresses`;
      
      const response = await HttpInterceptor.get<CustomerAddressApiItem[]>(
        endpoint,
        { userType: 'seller' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error fetching customer addresses:', error);
      if (error?.status === 404) {
        return [];
      }
      throw new Error(error?.message || 'Không thể tải địa chỉ khách hàng');
    }
  }

  /**
   * Cancel order (for PENDING orders)
   * PATCH /api/v1/stores/{storeId}/orders/{orderId}/cancel
   */
  static async cancelOrder(orderId: string, reason: string): Promise<StoreOrder> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${orderId}/cancel`;
      
      const response = await HttpInterceptor.patch<StoreOrder>(
        endpoint,
        { reason },
        { userType: 'seller' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);
      throw new Error(error?.message || 'Không thể hủy đơn hàng');
    }
  }
}

export default StoreOrderService;

