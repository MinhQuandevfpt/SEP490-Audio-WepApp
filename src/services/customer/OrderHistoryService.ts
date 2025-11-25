/**
 * Order History Service
 * Handles customer order history operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type {
  OrderHistoryResponse,
  OrderHistoryRequest,
  CustomerOrder,
  StoreOrder,
  OrderItem,
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

      const normalizedItems = (response.items || []).map((order) => this.normalizeOrder(order));

      let filteredItems = normalizedItems;

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

      let order: CustomerOrder | null = null;
      if (response && typeof response === 'object' && 'data' in response) {
        order = (response as { data: CustomerOrder }).data;
      } else {
        order = response as CustomerOrder;
      }

      if (!order) {
        return null;
      }

      return this.normalizeOrder(order as CustomerOrder & { items?: any[] });
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

  /**
   * Normalize API response to always include storeOrders array
   * New backend response may return items at root level without storeOrders
   */
  private static normalizeOrder(order: CustomerOrder & { items?: any[] }): CustomerOrder {
    if (Array.isArray(order.storeOrders) && order.storeOrders.length > 0) {
      return order;
    }

    const generatedStoreOrders = this.createStoreOrdersFromItems(order);

    return {
      ...order,
      storeOrders: generatedStoreOrders,
    };
  }

  /**
   * Convert flat order items into storeOrders to keep UI backward-compatible
   */
  private static createStoreOrdersFromItems(order: CustomerOrder & { items?: any[] }): StoreOrder[] {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    if (rawItems.length === 0) {
      return [];
    }

    const grouped = new Map<string, { storeId: string; storeName: string; items: OrderItem[] }>();

    rawItems.forEach((item: any, index: number) => {
      const storeId = item.storeId || 'unknown-store';
      const storeName =
        item.storeName ||
        item.storeDisplayName ||
        (storeId !== 'unknown-store' ? `Cửa hàng ${storeId.slice(0, 6)}` : 'Cửa hàng');

      const normalizedItem: OrderItem = {
        id: item.id || `${order.id}-item-${index + 1}`,
        type: item.type || 'PRODUCT',
        refId: item.refId || item.productId || item.id || `${order.id}-ref-${index + 1}`,
        name: item.name || 'Sản phẩm',
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        lineTotal: item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1),
        image: item.image || item.thumbnail || item.productImage,
      };

      if (!grouped.has(storeId)) {
        grouped.set(storeId, { storeId, storeName, items: [] });
      }
      grouped.get(storeId)!.items.push(normalizedItem);
    });

    const totalLineAmount =
      Array.from(grouped.values()).reduce(
        (sum, group) => sum + group.items.reduce((sub, item) => sub + (item.lineTotal || 0), 0),
        0,
      ) || 0;

    const shippingFeeTotal = order.shippingFeeTotal ?? 0;
    const discountTotal = order.discountTotal ?? 0;

    return Array.from(grouped.values()).map((group, groupIndex) => {
      const subtotal = group.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
      const ratio =
        totalLineAmount > 0 ? subtotal / totalLineAmount : 1 / Math.max(1, grouped.size);

      const storeShippingFee = Math.round(shippingFeeTotal * ratio);
      const storeDiscount = Math.round(discountTotal * ratio);

      return {
        id: `${order.id}-store-${groupIndex + 1}`,
        orderCode: order.orderCode ?? null,
        storeId: group.storeId,
        storeName: group.storeName,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: subtotal,
        discountTotal: storeDiscount,
        shippingFee: storeShippingFee,
        grandTotal: subtotal - storeDiscount + storeShippingFee,
        items: group.items,
      };
    });
  }
}

export default OrderHistoryService;


