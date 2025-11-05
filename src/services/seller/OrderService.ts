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
import type { ApiResponse } from '../../types/api';

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

      const endpoint = `/api/v1/stores/${storeId}/orders?${queryParams.toString()}`;
      
      const response = await HttpInterceptor.get<StoreOrdersResponse>(
        endpoint,
        { userType: 'seller' }
      );

      let filteredItems = response.items || [];

      // Client-side search by order ID, customer name, or phone
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredItems = filteredItems.filter(order => 
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
   * GET /api/v1/stores/{storeId}/orders/{orderId}
   */
  static async getOrderById(orderId: string): Promise<StoreOrder | null> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${orderId}`;
      
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
   * PUT /api/v1/stores/{storeId}/orders/{orderId}/status
   */
  static async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<StoreOrder> {
    try {
      const storeId = await this.getStoreId();
      const endpoint = `/api/v1/stores/${storeId}/orders/${orderId}/status`;
      
      const response = await HttpInterceptor.put<StoreOrder>(
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
}

export default StoreOrderService;

