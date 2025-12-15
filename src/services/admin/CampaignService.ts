import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  Campaign, 
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignResponse,
  CampaignListResponse,
  CampaignStatus,
  CampaignType,
  AdminCampaignDetail,
  AdminCampaignProductRow,
  AdminCampaignProductStatus,
  CampaignOverviewResponse,
  CampaignProduct
} from '../../types/admin';
import { CampaignProductService } from './CampaignProductService';

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
   * Get campaign detail with products grouped by store (API 3 style)
   * Uses existing /api/campaigns/overview via CampaignProductService
   */
  static async getCampaignDetail(campaignId: string): Promise<AdminCampaignDetail> {
    try {
      // Fetch main campaign info + overview in parallel
      const [campaign, overview]: [Campaign, CampaignOverviewResponse] = await Promise.all([
        this.getCampaignById(campaignId),
        CampaignProductService.getCampaignOverview({ campaignId, page: 0, size: 1000 })
      ]);

      const overviewItem = overview.data.data[0];
      const products: CampaignProduct[] = overviewItem?.products ?? [];

      // Group products by store
      const storeMap = new Map<string, {
        storeId: string;
        storeName: string;
        products: CampaignProduct[];
      }>();

      products.forEach((p) => {
        if (!storeMap.has(p.storeId)) {
          storeMap.set(p.storeId, {
            storeId: p.storeId,
            storeName: p.storeName,
            products: []
          });
        }
        storeMap.get(p.storeId)!.products.push(p);
      });

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignType: campaign.type,
        status: campaign.status,
        startTime: campaign.startTime,
        endTime: campaign.endTime,
        badgeLabel: campaign.badgeLabel,
        badgeColor: campaign.badgeColor,
        badgeIconUrl: campaign.badgeIconUrl,
        stores: Array.from(storeMap.values())
      };
    } catch (error: any) {
      console.error('Error fetching campaign detail:', error);
      throw new Error(error.message || 'Không thể tải chi tiết chiến dịch');
    }
  }

  /**
   * Get flat campaign product rows for management table (API 2)
   */
  static async getCampaignProducts(params: {
    campaignId: string;
    storeId?: string;
    status?: AdminCampaignProductStatus;
  }): Promise<AdminCampaignProductRow[]> {
    try {
      const query = new URLSearchParams();
      query.append('campaignId', params.campaignId);
      if (params.storeId) query.append('storeId', params.storeId);
      if (params.status) query.append('status', params.status);

      const endpoint = `/api/campaigns/products/details?${query.toString()}`;

      const response = await HttpInterceptor.fetch<{
        status: number;
        message: string;
        data: AdminCampaignProductRow[];
      }>(
        endpoint,
        { userType: 'admin' }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching campaign products:', error);
      throw new Error(error.message || 'Không thể tải danh sách sản phẩm chiến dịch');
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
   * 
   * 📝 FLOW CHÍNH XÁC:
   * 1. DRAFT (Bản nháp)
   *    - Admin vừa tạo xong
   *    - ❌ Seller CHƯA thấy campaign này
   *    - ❌ Chưa thể đăng ký tham gia
   * 
   * 2. Admin nhấn "Gửi/Mở đăng ký" → ONOPEN
   *    - ✅ Seller BẮT ĐẦU thấy campaign
   *    - ✅ Seller có thể đăng ký tham gia
   *    - ⏳ Chờ đến startTime
   * 
   * 3. ONOPEN → ACTIVE (⏰ Scheduler tự động khi đến startTime)
   *    - Campaign bắt đầu chạy thực sự
   * 
   * 4. ACTIVE → EXPIRED (⏰ Scheduler tự động khi qua endTime)
   *    - Campaign kết thúc
   * 
   * 5. DISABLED (🚫 Admin khóa bất cứ lúc nào)
   *    - Khẩn cấp tắt campaign từ bất kỳ trạng thái nào
   * 
   * FE chỉ được phép chuyển:
   * - DRAFT → ONOPEN (Gửi campaign cho seller)
   * - Bất kỳ → DISABLED (Khóa campaign)
   * 
   * KHÔNG được chuyển thủ công:
   * - → ACTIVE (Scheduler tự bật khi tới startTime)
   * - → EXPIRED (Scheduler tự tắt khi qua endTime)
   */
  static async updateCampaignStatus(id: string, status: CampaignStatus): Promise<string> {
    try {
      // Validate allowed transitions from FE
      if (status === 'ACTIVE') {
        throw new Error('Không thể chuyển sang ACTIVE thủ công. Hệ thống sẽ tự động kích hoạt khi đến giờ bắt đầu.');
      }
      if (status === 'EXPIRED') {
        throw new Error('Không thể chuyển sang EXPIRED thủ công. Hệ thống sẽ tự động hết hạn khi qua thời gian kết thúc.');
      }

      const response = await HttpInterceptor.fetch<{
        status: number;
        message: string;
        data: string;
      }>(
        `/api/campaigns/${id}/status?status=${status}`,
        {
          method: 'PATCH',
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
   * Kiểm tra xem có thể chuyển trạng thái hay không
   */
  static canChangeStatus(currentStatus: CampaignStatus, newStatus: CampaignStatus): boolean {
    // Allowed transitions from FE perspective
    const allowedTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      'DRAFT': ['ONOPEN', 'DISABLED'],
      'ONOPEN': ['DISABLED'],
      'ACTIVE': ['DISABLED'], // BE sẽ tự chuyển ACTIVE, nhưng admin có thể disable
      'DISABLED': ['ONOPEN', 'DRAFT'],
      'APPROVE': ['DISABLED'],
      'EXPIRED': [] // Không được chuyển từ EXPIRED
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Lấy label mô tả cho status transition
   */
  static getStatusTransitionLabel(status: CampaignStatus): string {
    const labels: Record<CampaignStatus, string> = {
      'DRAFT': 'Lưu nháp',
      'ONOPEN': 'Gửi & Mở đăng ký', // Seller bắt đầu thấy campaign
      'ACTIVE': 'Kích hoạt',
      'DISABLED': 'Vô hiệu hóa',
      'APPROVE': 'Phê duyệt',
      'EXPIRED': 'Hết hạn'
    };
    return labels[status] || status;
  }

  /**
   * Lấy mô tả chi tiết cho status
   */
  static getStatusDescription(status: CampaignStatus): string {
    const descriptions: Record<CampaignStatus, string> = {
      'DRAFT': '📝 Bản nháp - Seller chưa thấy campaign này',
      'ONOPEN': '📢 Đang mở đăng ký - Seller có thể tham gia',
      'ACTIVE': '🔥 Đang diễn ra - Campaign đang chạy',
      'DISABLED': '🚫 Đã vô hiệu hóa - Campaign bị khóa',
      'APPROVE': '✅ Đã phê duyệt',
      'EXPIRED': '⏱️ Đã hết hạn - Campaign kết thúc'
    };
    return descriptions[status] || status;
  }

  /**
   * Format status label
   */
  static getStatusLabel(status: CampaignStatus): string {
    const labels: Record<CampaignStatus, string> = {
      DRAFT: 'Bản nháp',
      ONOPEN: 'Đang mở đăng ký',
      ACTIVE: 'Đang diễn ra',
      APPROVE: 'Đã phê duyệt',
      DISABLED: 'Đã vô hiệu hóa',
      EXPIRED: 'Đã hết hạn'
    };
    return labels[status] || status;
  }

  /**
   * Get status color
   */
  static getStatusColor(status: CampaignStatus): string {
    const colors: Record<CampaignStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ONOPEN: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      APPROVE: 'bg-purple-100 text-purple-800',
      DISABLED: 'bg-orange-100 text-orange-800',
      EXPIRED: 'bg-red-100 text-red-800'
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
