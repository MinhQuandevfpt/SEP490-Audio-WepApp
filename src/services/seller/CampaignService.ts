import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  CampaignForSeller, 
  JoinCampaignRequest, 
  JoinCampaignResponse,
  CampaignProductDetail,
  CampaignProductDetailsResponse,
  CampaignProductStatus
} from '../../types/seller';

const API_BASE_URL = '/api/campaigns';

interface CampaignListResponse {
  status: number;
  message: string;
  data: CampaignForSeller[];
}

interface CampaignDetailResponse {
  status: number;
  message: string;
  data: CampaignForSeller;
}

export class SellerCampaignService {
  /**
   * Get all available campaigns for seller
   */
  static async getAllCampaigns(): Promise<CampaignForSeller[]> {
    try {
      console.log('🚀 Fetching campaigns from:', API_BASE_URL);
      
      const response = await HttpInterceptor.fetch<CampaignListResponse>(
        API_BASE_URL,
        { 
          method: 'GET',
          userType: 'seller' 
        }
      );
      
      console.log('📦 API Response:', response);
      console.log('📊 Campaigns data:', response.data);
      
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching campaigns:', error);
      throw new Error(error.message || 'Không thể tải danh sách chiến dịch');
    }
  }

  /**
   * Get campaign details by ID
   */
  static async getCampaignById(campaignId: string): Promise<CampaignForSeller> {
    try {
      const response = await HttpInterceptor.fetch<CampaignDetailResponse>(
        `${API_BASE_URL}/${campaignId}`,
        {
          method: 'GET',
          userType: 'seller'
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch campaign details');
    }
  }

  /**
   * Join a campaign with products
   */
  static async joinCampaign(
    campaignId: string, 
    request: JoinCampaignRequest
  ): Promise<JoinCampaignResponse> {
    try {
      const response = await HttpInterceptor.fetch<JoinCampaignResponse>(
        `${API_BASE_URL}/${campaignId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          userType: 'seller'
        }
      );
      return response;
    } catch (error: any) {
      console.error('❌ Error joining campaign:', error);
      throw new Error(error.message || 'Không thể tham gia chiến dịch');
    }
  }

  /**
   * Get joined campaigns for store
   * @param storeId - Store ID
   * @param campaignStatus - Filter by campaign status (ONOPEN | ACTIVE | EXPIRED)
   * @param storeApproved - Filter by store approval status (true | false | null)
   */
  static async getJoinedCampaigns(
    storeId: string,
    campaignStatus?: 'ONOPEN' | 'ACTIVE' | 'EXPIRED',
    storeApproved?: boolean | null
  ): Promise<CampaignForSeller[]> {
    try {
      const params = new URLSearchParams();
      params.append('storeId', storeId);
      
      if (campaignStatus) {
        params.append('campaignStatus', campaignStatus);
      }
      
      if (storeApproved !== undefined && storeApproved !== null) {
        params.append('storeApproved', storeApproved.toString());
      }

      console.log('🚀 Fetching joined campaigns from:', `${API_BASE_URL}/joined-campaigns?${params.toString()}`);
      
      const response = await HttpInterceptor.fetch<any[]>(
        `${API_BASE_URL}/joined-campaigns?${params.toString()}`,
        { 
          method: 'GET',
          userType: 'seller' 
        }
      );
      
      console.log('📦 Joined campaigns response:', response);
      
      // Response trả về trực tiếp là array, không có wrapper
      // API trả về campaignType thay vì type, cần map lại
      if (Array.isArray(response)) {
        return response.map(campaign => ({
          ...campaign,
          type: campaign.campaignType || campaign.type, // Map campaignType -> type
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching joined campaigns:', error);
      throw new Error(error.message || 'Không thể tải danh sách chiến dịch đã tham gia');
    }
  }

  /**
   * Get campaign product details for store
   * @param storeId - Store ID
   * @param campaignId - Campaign ID
   * @param status - Filter by product status (DRAFT | ACTIVE | APPROVE | EXPIRED | REJECTED | DISABLED)
   */
  static async getCampaignProductDetails(
    storeId: string,
    campaignId: string,
    status?: CampaignProductStatus
  ): Promise<CampaignProductDetail[]> {
    try {
      const params = new URLSearchParams();
      params.append('storeId', storeId);
      params.append('campaignId', campaignId);
      
      if (status) {
        params.append('status', status);
      }

      console.log('🚀 Fetching campaign product details:', `${API_BASE_URL}/products/details?${params.toString()}`);
      
      const response = await HttpInterceptor.fetch<CampaignProductDetailsResponse>(
        `${API_BASE_URL}/products/details?${params.toString()}`,
        { 
          method: 'GET',
          userType: 'seller' 
        }
      );
      
      console.log('📦 Campaign product details response:', response);
      
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching campaign product details:', error);
      throw new Error(error.message || 'Không thể tải chi tiết sản phẩm chiến dịch');
    }
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Format date for short display
   */
  static formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Get status label in Vietnamese
   */
  static getStatusLabel(status: CampaignForSeller['status']): string {
    const labels: Record<CampaignForSeller['status'], string> = {
      DRAFT: 'Bản nháp',
      ONOPEN: 'Mở đăng ký',
      ACTIVE: 'Đang diễn ra',
      APPROVE: 'Đã duyệt',
      DISABLED: 'Vô hiệu hóa',
      EXPIRED: 'Hết hạn',
    };
    return labels[status] || status;
  }

  /**
   * Get type label in Vietnamese
   */
  static getTypeLabel(type: CampaignForSeller['type']): string {
    return type === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale';
  }

  /**
   * Check if campaign is open for registration
   */
  static canJoinCampaign(
    status: CampaignForSeller['status'],
    startTime?: string
  ): boolean {
    if (status !== 'ONOPEN') return false;
    // Registration is open only before the campaign start time (if provided)
    if (startTime) {
      return new Date().getTime() < new Date(startTime).getTime();
    }
    return true;
  }

  /**
   * Calculate time remaining
   */
  static getTimeRemaining(endTime: string): string {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Đã kết thúc';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `Còn ${days} ngày`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return `Còn ${minutes} phút`;
  }

  /**
   * Get detailed remaining time: X ngày Y giờ Z phút AA giây
   */
  static getTimeRemainingDetailed(targetTime: string): string {
    const now = Date.now();
    const target = new Date(targetTime).getTime();
    let diff = target - now;
    if (diff <= 0) return '0 phút';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 24 * 60 * 60 * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 60 * 1000;
    const seconds = Math.floor(diff / 1000);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    if (seconds > 0) parts.push(`${seconds} giây`);
    return parts.join(' ');
  }

  /**
   * Check if campaign has started
   */
  static hasStarted(startTime: string): boolean {
    return new Date(startTime).getTime() <= new Date().getTime();
  }

  /**
   * Check if campaign has ended
   */
  static hasEnded(endTime: string): boolean {
    return new Date(endTime).getTime() < new Date().getTime();
  }
}
