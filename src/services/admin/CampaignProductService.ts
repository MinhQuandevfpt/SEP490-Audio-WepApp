import { HttpInterceptor } from '../HttpInterceptor';
import type {
  CampaignOverviewResponse,
  CampaignType,
  VoucherStatus,
  Campaign
} from '../../types/admin';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_BASE_URL = BASE_URL.endsWith('/api') ? `${BASE_URL}/campaigns` : `${BASE_URL}/api/campaigns`;

export class CampaignProductService {
  /**
   * Get campaign overview with products (supports filtering and pagination)
   */
  static async getCampaignOverview(params?: {
    type?: CampaignType;
    status?: VoucherStatus;
    storeId?: string;
    campaignId?: string;
    page?: number;
    size?: number;
  }): Promise<CampaignOverviewResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.campaignId) queryParams.append('campaignId', params.campaignId);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());

      const url = `${API_BASE_URL}/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await HttpInterceptor.fetch<CampaignOverviewResponse>(
        url,
        {
          method: 'GET',
          userType: 'admin'
        }
      );

      return response;
    } catch (error: any) {
      console.error('❌ Error fetching campaign overview:', error);
      throw new Error(error.message || 'Không thể tải danh sách sản phẩm chiến dịch');
    }
  }

  /**
   * Approve campaign products
   * @param campaignId - Campaign ID
   * @param campaignProductIds - Array of campaign product IDs
   */
  static async approveProducts(campaignId: string, campaignProductIds: string[]): Promise<void> {
    const response = await HttpInterceptor.put(
      `/api/campaigns/${campaignId}/approve-products`,
      campaignProductIds,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * Reject campaign products
   * @param campaignId - Campaign ID
   * @param campaignProductIds - Array of campaign product IDs
   * @param reason - Rejection reason (optional, applies to all products if provided)
   * @param reasonMap - Map of product ID to individual rejection reason (optional)
   */
  static async rejectProducts(
    campaignId: string, 
    campaignProductIds: string[], 
    reason?: string,
    reasonMap?: Record<string, string>
  ): Promise<void> {
    const response = await HttpInterceptor.post(
      `/api/campaigns/${campaignId}/products/reject`,
      { 
        campaignProductIds,
        ...(reason && { reason }),
        ...(reasonMap && { reasonMap })
      },
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * Get all campaigns for filter dropdown
   */
  static async getAllCampaignsForFilter(): Promise<Campaign[]> {
    try {
      const response = await HttpInterceptor.fetch<{ status: number; message: string; data: Campaign[] }>(
        API_BASE_URL,
        {
          method: 'GET',
          userType: 'admin'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching campaigns:', error);
      throw new Error(error.message || 'Không thể tải danh sách chiến dịch');
    }
  }

  /**
   * Get status label in Vietnamese
   */
  static getVoucherStatusLabel(status: VoucherStatus): string {
    const labels: Record<VoucherStatus, string> = {
      DRAFT: 'Chờ duyệt',
      APPROVE: 'Đã duyệt',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      DISABLED: 'Vô hiệu hóa',
      REJECTED: 'Từ chối'
    };
    return labels[status] || status;
  }

  /**
   * Get status tag color
   */
  static getVoucherStatusColor(status: VoucherStatus): string {
    const colors: Record<VoucherStatus, string> = {
      DRAFT: 'orange',
      APPROVE: 'green',
      ACTIVE: 'blue',
      EXPIRED: 'default',
      DISABLED: 'red',
      REJECTED: 'red'
    };
    return colors[status] || 'default';
  }

  /**
   * Format discount value
   */
  static formatDiscount(voucher: { type: string; discountValue: number | null; discountPercent: number | null }): string {
    if (voucher.type === 'PERCENT' && voucher.discountPercent) {
      return `-${voucher.discountPercent}%`;
    }
    if (voucher.type === 'FIXED' && voucher.discountValue) {
      return `-${voucher.discountValue.toLocaleString('vi-VN')}₫`;
    }
    return 'N/A';
  }

  /**
   * Calculate discounted price
   */
  static calculateDiscountedPrice(
    originalPrice: number,
    voucher: { type: string; discountValue: number | null; discountPercent: number | null; maxDiscountValue: number | null }
  ): number {
    if (voucher.type === 'PERCENT' && voucher.discountPercent) {
      const discount = (originalPrice * voucher.discountPercent) / 100;
      const maxDiscount = voucher.maxDiscountValue || discount;
      return originalPrice - Math.min(discount, maxDiscount);
    }
    if (voucher.type === 'FIXED' && voucher.discountValue) {
      return Math.max(0, originalPrice - voucher.discountValue);
    }
    return originalPrice;
  }
}
