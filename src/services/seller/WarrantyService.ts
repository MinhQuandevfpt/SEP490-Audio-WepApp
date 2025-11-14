/**
 * Warranty Service for Seller
 * Handles seller warranty operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type { ApiResponse, Warranty } from '../../types/api';

export class SellerWarrantyService {
  /**
   * Get warranties by store order ID
   * GET /api/warranties/by-store-order/{storeOrderId}
   */
  static async getWarrantiesByStoreOrder(storeOrderId: string): Promise<Warranty[]> {
    try {
      const endpoint = `/api/warranties/by-store-order/${storeOrderId}`;
      
      const response = await HttpInterceptor.get<ApiResponse<Warranty[]>>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.message || 'Không thể tải danh sách bảo hành');
      }

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching warranties by store order:', error);
      // Return empty array if order has no warranties yet
      if (error?.status === 404) {
        return [];
      }
      throw new Error(error?.message || 'Không thể tải danh sách bảo hành');
    }
  }

  /**
   * Activate warranty for a store order
   * POST /api/warranties/activate/store-order/{storeOrderId}
   */
  static async activateWarrantyByStoreOrder(storeOrderId: string): Promise<void> {
    try {
      const endpoint = `/api/warranties/activate/store-order/${storeOrderId}`;
      
      const response = await HttpInterceptor.post<ApiResponse<null>>(
        endpoint,
        undefined, // Empty body
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.message || 'Kích hoạt bảo hành thất bại');
      }
    } catch (error: any) {
      console.error('❌ Error activating warranty:', error);
      throw new Error(error?.message || 'Không thể kích hoạt bảo hành');
    }
  }

  /**
   * Activate serial number for a warranty
   * POST /api/warranties/{warrantyId}/activate-serial
   */
  static async activateSerialNumber(
    warrantyId: string,
    serialNumber: string,
    note?: string
  ): Promise<Warranty> {
    try {
      const endpoint = `/api/warranties/${warrantyId}/activate-serial`;
      
      const requestBody: { serialNumber: string; note?: string } = {
        serialNumber,
      };
      
      if (note && note.trim()) {
        requestBody.note = note.trim();
      }
      
      const response = await HttpInterceptor.post<ApiResponse<Warranty>>(
        endpoint,
        requestBody,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.message || 'Thêm số serial thất bại');
      }

      return response.data!;
    } catch (error: any) {
      console.error('❌ Error activating serial number:', error);
      throw new Error(error?.message || 'Không thể thêm số serial');
    }
  }
}

export default SellerWarrantyService;

