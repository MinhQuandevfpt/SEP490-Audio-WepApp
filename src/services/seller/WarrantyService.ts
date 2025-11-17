/**
 * Warranty Service for Seller
 * Handles seller warranty operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import { StoreService } from './StoreService';
import type { ApiResponse, Warranty, WarrantyLog, WarrantyLogListResponse, WarrantyLogStatus, UpdateWarrantyLogRequest } from '../../types/api';

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

  /**
   * Get warranty logs for a warranty
   * GET /api/warranties/logs?warrantyId={warrantyId}&storeId={storeId}
   */
  static async getWarrantyLogs(
    warrantyId: string,
    status?: WarrantyLogStatus
  ): Promise<WarrantyLog[]> {
    try {
      const storeId = await StoreService.getStoreId();
      if (!storeId) {
        throw new Error('Store ID not found. Please login again.');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('warrantyId', warrantyId);
      queryParams.append('storeId', storeId);
      if (status) {
        queryParams.append('status', status);
      }

      const endpoint = `/api/warranties/logs?${queryParams.toString()}`;
      
      const response = await HttpInterceptor.get<WarrantyLogListResponse>(
        endpoint,
        { userType: 'seller' }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching warranty logs:', error);
      throw new Error(error?.message || 'Không thể tải lịch sử sửa chữa');
    }
  }

  /**
   * Update a warranty log status and details
   * PATCH /api/warranties/logs/{logId}?status={status}
   */
  static async updateWarrantyLog(
    logId: string,
    status: WarrantyLogStatus,
    payload: UpdateWarrantyLogRequest = {}
  ): Promise<WarrantyLog> {
    try {
      const endpoint = `/api/warranties/logs/${logId}?status=${status}`;

      const response = await HttpInterceptor.patch<ApiResponse<WarrantyLog>>(
        endpoint,
        payload,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.message || 'Cập nhật log bảo hành thất bại');
      }

      return response.data!;
    } catch (error: any) {
      console.error('❌ Error updating warranty log:', error);
      throw new Error(error?.message || 'Không thể cập nhật log bảo hành');
    }
  }
}

export default SellerWarrantyService;

