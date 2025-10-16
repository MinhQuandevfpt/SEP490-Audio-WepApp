// Admin KYC Management Service
import type { 
  KycFilterResponse, 
  KycApproveResponse, 
  KycRejectResponse,
  KycStatus 
} from '../../types/admin';
import { showSuccess, showError } from '../../utils/notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class AdminKycService {
  /**
   * Get KYC requests by status
   */
  static async getKycByStatus(status: KycStatus): Promise<KycFilterResponse> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Use placeholder {storeId} as per API specification
      // Backend should handle this for admin endpoints
      const response = await fetch(`${API_URL}/stores/{storeId}/kyc/filter?status=${status}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: KycFilterResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get KYC by status error:', error);
      throw error;
    }
  }

  /**
   * Get all KYC requests (all statuses)
   */
  static async getAllKyc(): Promise<KycFilterResponse> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Fetch all statuses and combine
      const [pending, approved, rejected] = await Promise.all([
        this.getKycByStatus('PENDING'),
        this.getKycByStatus('APPROVED'),
        this.getKycByStatus('REJECTED'),
      ]);

      return {
        status: 200,
        message: 'Danh sách tất cả KYC',
        data: [...pending.data, ...approved.data, ...rejected.data]
      };
    } catch (error) {
      console.error('Get all KYC error:', error);
      throw error;
    }
  }

  /**
   * Approve KYC request
   */
  static async approveKyc(kycId: string): Promise<KycApproveResponse> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Use placeholder {storeId} as per API specification
      const response = await fetch(`${API_URL}/stores/{storeId}/kyc/${kycId}/approve`, {
        method: 'PATCH',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: KycApproveResponse = await response.json();
      showSuccess('Phê duyệt KYC thành công!');
      return data;
    } catch (error) {
      console.error('Approve KYC error:', error);
      showError(error instanceof Error ? error.message : 'Lỗi khi phê duyệt KYC');
      throw error;
    }
  }

  /**
   * Reject KYC request
   */
  static async rejectKyc(kycId: string, reason: string): Promise<KycRejectResponse> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Use placeholder {storeId} as per API specification
      const response = await fetch(`${API_URL}/stores/{storeId}/kyc/${kycId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: 'PATCH',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: KycRejectResponse = await response.json();
      showSuccess('Đã từ chối KYC!');
      return data;
    } catch (error) {
      console.error('Reject KYC error:', error);
      showError(error instanceof Error ? error.message : 'Lỗi khi từ chối KYC');
      throw error;
    }
  }
}
