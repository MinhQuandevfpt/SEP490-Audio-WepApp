import { HttpInterceptor } from '../HttpInterceptor';
import type { WithdrawRequest, WithdrawRequestsPage, WithdrawRequestStatus } from '../../types/api';
import { AdminUserService } from './AdminUserService';

export class AdminWalletService {
  /**
   * Get customer withdraw requests (Admin xem danh sách yêu cầu rút tiền)
   * GET /api/admin/customer-withdraw-requests
   */
  static async getCustomerWithdrawRequests(params?: {
    status?: WithdrawRequestStatus;
    page?: number;
    size?: number;
  }): Promise<WithdrawRequestsPage> {
    const query = new URLSearchParams();
    
    if (params?.status) query.append('status', params.status);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    
    const response = await HttpInterceptor.get<any>(
      `/api/admin/customer-withdraw-requests${queryString}`,
      {
        userType: 'admin',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Approve customer withdraw request (Admin duyệt yêu cầu rút tiền)
   * POST /api/admin/customer-withdraw-requests/{id}/approve
   */
  static async approveWithdrawRequest(
    requestId: string,
    payload?: { note?: string }
  ): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.post<any>(
      `/api/admin/customer-withdraw-requests/${requestId}/approve`,
      payload || {},
      {
        userType: 'admin',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Reject customer withdraw request (Admin từ chối yêu cầu rút tiền)
   * POST /api/admin/customer-withdraw-requests/{id}/reject
   */
  static async rejectWithdrawRequest(
    requestId: string,
    payload: { note: string }
  ): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.post<any>(
      `/api/admin/customer-withdraw-requests/${requestId}/reject`,
      payload,
      {
        userType: 'admin',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Get withdraw request detail (Admin xem chi tiết yêu cầu)
   * GET /api/admin/customer-withdraw-requests/{id}
   */
  static async getWithdrawRequestDetail(requestId: string): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.get<any>(
      `/api/admin/customer-withdraw-requests/${requestId}`,
      {
        userType: 'admin',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Mark withdraw request as PAID (Admin xác nhận đã chuyển tiền)
   * POST /api/admin/customer-withdraw-requests/{id}/paid
   */
  static async markAsPaid(
    requestId: string,
    payload: {
      payoutRef?: string;
      note?: string;
      proofUrls: string[];
    }
  ): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.post<any>(
      `/api/admin/customer-withdraw-requests/${requestId}/paid`,
      payload,
      {
        userType: 'admin',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Upload image file (for proof images)
   */
  static async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await HttpInterceptor.post<any>(
        '/api/admin/upload/image',
        formData,
        {
          userType: 'admin',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Return image URL from response
      return response.data?.url || response.url || response.data || response;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  /**
   * Get customer info by ID (for displaying customer details)
   */
  static async getCustomerInfo(customerId: string): Promise<any> {
    return AdminUserService.getCustomerById(customerId);
  }
}

export default AdminWalletService;
