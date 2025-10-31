import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  Campaign, 
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignResponse,
  CampaignListResponse,
  CampaignStatus,
  CampaignType
} from '../../types/admin';

export class CampaignService {
  /**
   * Tạo chiến dịch mới (MEGA_SALE hoặc FAST_SALE)
   */
  static async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    try {
      const response = await HttpInterceptor.fetch<CampaignResponse>(
        '/api/campaigns',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          userType: 'admin'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      throw new Error(error.message || 'Không thể tạo chiến dịch');
    }
  }

  /**
   * Lấy danh sách tất cả chiến dịch
   * Có thể lọc theo type, status, hoặc khoảng thời gian
   */
  static async getAllCampaigns(filters?: {
    type?: CampaignType;
    status?: CampaignStatus;
    start?: string;
    end?: string;
  }): Promise<Campaign[]> {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start) params.append('start', filters.start);
      if (filters?.end) params.append('end', filters.end);
      
      const queryString = params.toString();
      const endpoint = `/api/campaigns${queryString ? `?${queryString}` : ''}`;
      
      const response = await HttpInterceptor.fetch<CampaignListResponse>(
        endpoint,
        { userType: 'admin' }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      throw new Error(error.message || 'Không thể tải danh sách chiến dịch');
    }
  }

  /**
   * Lấy chi tiết chiến dịch theo ID
   * Backend không hỗ trợ GET /api/campaigns/{id}
   * Workaround: Lấy từ danh sách campaigns
   */
  static async getCampaignById(id: string): Promise<Campaign> {
    try {
      console.log('📋 Fetching campaign by ID from list:', id);
      
      // Lấy tất cả campaigns và filter theo ID
      const response = await HttpInterceptor.fetch<CampaignListResponse>(
        `/api/campaigns`,
        { 
          method: 'GET',
          userType: 'admin' 
        }
      );
      
      const campaign = response.data.find(c => c.id === id);
      
      if (!campaign) {
        throw new Error('Không tìm thấy chiến dịch');
      }
      
      console.log('✅ Campaign found:', campaign);
      return campaign;
    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      throw new Error(error.message || 'Không thể tải chi tiết chiến dịch');
    }
  }

  /**
   * Cập nhật chiến dịch
   * Cho phép cập nhật thông tin campaign (name, desc, badge...).
   * Nếu là FAST_SALE, có thể gửi danh sách flashSlots:
   * - Có id: cập nhật slot cũ
   * - Không có id: tạo slot mới
   * Khi cập nhật status → DISABLED: tất cả slot & sản phẩm bị disable
   * Khi bật lại → ACTIVE: slot & product được phục hồi tương ứng
   */
  static async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    try {
      console.log('🔄 Updating campaign:', id, 'with data:', data);
      
      // Try PATCH first (common for partial updates), fallback to PUT
      const methods = ['PATCH', 'PUT'];
      let lastError = null;

      for (const method of methods) {
        try {
          console.log(`Trying ${method} /api/campaigns/${id}`);
          
          const response = await HttpInterceptor.fetch<CampaignResponse>(
            `/api/campaigns/${id}`,
            {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              userType: 'admin'
            }
          );
          
          console.log('✅ Campaign updated successfully with', method);
          return response.data;
        } catch (error: any) {
          console.warn(`${method} failed:`, error.message);
          lastError = error;
          
          // If not 405, throw immediately (other error)
          if (error.status && error.status !== 405) {
            throw error;
          }
          
          // Continue to next method
        }
      }

      // All methods failed
      throw lastError;
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      throw new Error(error.message || 'Không thể cập nhật chiến dịch');
    }
  }

  /**
   * Xóa chiến dịch
   */
  static async deleteCampaign(id: string): Promise<void> {
    try {
      await HttpInterceptor.fetch(
        `/api/campaigns/${id}`,
        {
          method: 'DELETE',
          userType: 'admin'
        }
      );
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      throw new Error(error.message || 'Không thể xóa chiến dịch');
    }
  }

  /**
   * Cập nhật trạng thái chiến dịch
   */
  static async updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    try {
      const response = await HttpInterceptor.fetch<CampaignResponse>(
        `/api/campaigns/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
          userType: 'admin'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      throw new Error(error.message || 'Không thể cập nhật trạng thái');
    }
  }

  /**
   * Format status label
   */
  static getStatusLabel(status: CampaignStatus): string {
    const labels: Record<CampaignStatus, string> = {
      DRAFT: 'Bản nháp',
      SCHEDULED: 'Đã lên lịch',
      ACTIVE: 'Đang diễn ra',
      ENDED: 'Đã kết thúc',
      CANCELLED: 'Đã hủy',
      EXPIRED: 'Đã hết hạn',
      PENDING: 'Chờ xử lý'
    };
    return labels[status] || status;
  }

  /**
   * Get status color
   */
  static getStatusColor(status: CampaignStatus): string {
    const colors: Record<CampaignStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
      EXPIRED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format campaign type label
   */
  static getCampaignTypeLabel(type: 'MEGA_SALE' | 'FAST_SALE'): string {
    return type === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale';
  }

  /**
   * Format date
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
