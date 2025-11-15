/**
 * Warranty Service
 * Handles customer warranty operations
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type { Warranty, WarrantyListResponse } from '../../types/api';

export class WarrantyService {
  /**
   * Get customer email from localStorage (from customer_user JSON only)
   */
  private static getCustomerEmail(): string {
    const user = localStorage.getItem('customer_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.email) return userData.email;
      } catch {
        // fallback
      }
    }
    
    throw new Error('Customer email not found. Please login again.');
  }

  /**
   * Get warranties by customer email
   * GET /api/warranties?q={email}
   */
  static async getWarrantiesByEmail(): Promise<Warranty[]> {
    try {
      const email = this.getCustomerEmail();
      const endpoint = `/api/warranties?q=${encodeURIComponent(email)}`;
      
      const response = await HttpInterceptor.get<WarrantyListResponse>(
        endpoint,
        { userType: 'customer' }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching warranties:', error);
      throw new Error(error?.message || 'Không thể tải danh sách bảo hành');
    }
  }

  /**
   * Get warranties with optional filters
   * GET /api/warranties?serial={serial}&orderId={orderId}&q={email}
   */
  static async getWarranties(params?: {
    serial?: string;
    orderId?: string;
    q?: string;
  }): Promise<Warranty[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.serial) {
        queryParams.append('serial', params.serial);
      }
      
      if (params?.orderId) {
        queryParams.append('orderId', params.orderId);
      }
      
      // Use provided email or get from localStorage
      const email = params?.q || this.getCustomerEmail();
      queryParams.append('q', email);
      
      const endpoint = `/api/warranties?${queryParams.toString()}`;
      
      const response = await HttpInterceptor.get<WarrantyListResponse>(
        endpoint,
        { userType: 'customer' }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching warranties:', error);
      throw new Error(error?.message || 'Không thể tải danh sách bảo hành');
    }
  }

  /**
   * Get warranty by ID
   * GET /api/warranties/{warrantyId}
   */
  static async getWarrantyById(warrantyId: string): Promise<Warranty | null> {
    try {
      const endpoint = `/api/warranties/${warrantyId}`;
      
      const response = await HttpInterceptor.get<Warranty>(
        endpoint,
        { userType: 'customer' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error fetching warranty detail:', error);
      if (error?.status === 404) {
        return null;
      }
      throw new Error(error?.message || 'Không thể tải chi tiết bảo hành');
    }
  }

  /**
   * Request repair for a warranty
   * POST /api/warranties/{warrantyId}/logs
   */
  static async requestRepair(
    warrantyId: string,
    data: {
      problemDescription: string;
      covered: boolean | null;
      attachmentUrls: string[];
    }
  ): Promise<any> {
    try {
      const endpoint = `/api/warranties/${warrantyId}/logs`;
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        data,
        { userType: 'customer' }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error requesting repair:', error);
      throw new Error(error?.message || 'Không thể gửi yêu cầu sửa chữa');
    }
  }
}

export default WarrantyService;

