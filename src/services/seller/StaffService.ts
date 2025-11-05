/**
 * Staff Management Service
 * Handles staff CRUD operations for stores
 */

import { HttpInterceptor } from '../HttpInterceptor';
import { StoreService } from './StoreService';
import type {
  CreateStaffRequest,
  StaffResponse,
  StaffInfo,
  UpdateStaffRequest,
  StaffListResponse,
  StaffListData
} from '../../types/seller';
import type { ApiResponse } from '../../types/api';

export class StaffService {
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
   * Create a new staff member
   * POST /api/stores/{storeId}/staff
   * 
   * @param request - Staff creation request
   * @returns Created staff information
   */
  static async createStaff(request: CreateStaffRequest): Promise<StaffResponse> {
    try {
      const storeId = await this.getStoreId();
      console.log('👤 Creating staff:', { storeId, request });

      const response = await HttpInterceptor.post<StaffResponse>(
        `/api/stores/${storeId}/staff`,
        request,
        { userType: 'seller' }
      );

      console.log('✅ Staff created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create staff:', error);
      throw error;
    }
  }

  /**
   * Get list of staff members
   * GET /api/stores/{storeId}/staff?page=0&size=10
   * 
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 10)
   * @returns List of staff members wrapped in ApiResponse
   */
  static async getStaffList(page: number = 0, size: number = 10): Promise<StaffListResponse> {
    try {
      const storeId = await this.getStoreId();
      console.log('👥 Fetching staff list:', { storeId, page, size });

      const response = await HttpInterceptor.get<ApiResponse<StaffListData>>(
        `/api/stores/${storeId}/staff?page=${page}&size=${size}`,
        { userType: 'seller' }
      );

      console.log('✅ Staff list fetched successfully');
      return response as StaffListResponse;
    } catch (error) {
      console.error('❌ Failed to fetch staff list:', error);
      throw error;
    }
  }

  /**
   * Get staff by ID
   * GET /api/stores/{storeId}/staff/{staffId}
   * 
   * @param staffId - Staff ID
   * @returns Staff information
   */
  static async getStaffById(staffId: string): Promise<StaffInfo> {
    try {
      const storeId = await this.getStoreId();
      console.log('👤 Fetching staff:', { storeId, staffId });

      const response = await HttpInterceptor.get<StaffInfo>(
        `/api/stores/${storeId}/staff/${staffId}`,
        { userType: 'seller' }
      );

      console.log('✅ Staff fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch staff:', error);
      throw error;
    }
  }

  /**
   * Update staff information
   * PUT /api/stores/{storeId}/staff/{staffId}
   * 
   * @param staffId - Staff ID
   * @param request - Update request
   * @returns Updated staff information
   */
  static async updateStaff(staffId: string, request: UpdateStaffRequest): Promise<StaffInfo> {
    try {
      const storeId = await this.getStoreId();
      console.log('✏️ Updating staff:', { storeId, staffId, request });

      const response = await HttpInterceptor.put<StaffInfo>(
        `/api/stores/${storeId}/staff/${staffId}`,
        request,
        { userType: 'seller' }
      );

      console.log('✅ Staff updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update staff:', error);
      throw error;
    }
  }

  /**
   * Delete staff member
   * DELETE /api/stores/{storeId}/staff/{staffId}
   * 
   * @param staffId - Staff ID
   */
  static async deleteStaff(staffId: string): Promise<void> {
    try {
      const storeId = await this.getStoreId();
      console.log('🗑️ Deleting staff:', { storeId, staffId });

      await HttpInterceptor.delete(
        `/api/stores/${storeId}/staff/${staffId}`,
        { userType: 'seller' }
      );

      console.log('✅ Staff deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete staff:', error);
      throw error;
    }
  }

  /**
   * Format staff error message
   */
  static formatStaffError(error: any): string {
    if (error?.status === 400) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (error?.status === 404) {
      return 'Không tìm thấy nhân viên.';
    }
    if (error?.status === 401) {
      return 'Vui lòng đăng nhập lại.';
    }
    if (error?.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }
    return error?.message || 'Đã xảy ra lỗi khi thao tác với nhân viên.';
  }
}

export default StaffService;

