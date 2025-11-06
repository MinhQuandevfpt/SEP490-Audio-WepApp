import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  CampaignForSeller, 
  JoinCampaignRequest, 
  JoinCampaignResponse 
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
  static canJoinCampaign(status: CampaignForSeller['status']): boolean {
    return status === 'ONOPEN';
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
