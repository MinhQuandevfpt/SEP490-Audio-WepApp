import { HttpInterceptor } from '../HttpInterceptor';
import type {
  FlashSaleCampaign,
  FlashSaleListResponse,
  FlashSaleProductsResponse,
  FlashSaleProduct,
  FlashSaleSlot,
  TimeFilter,
  CurrentFlashSaleSlot
} from '../../types/flashsale';

/**
 * Flash Sale Service
 * Quản lý các API liên quan đến Flash Sale (FAST_SALE campaigns)
 */
export class FlashSaleService {
  /**
   * 1. Lấy danh sách tất cả Flash Sale campaigns
   * GET /api/campaigns/fast-sale
   * 
   * @param filters - Lọc theo status, start, end
   */
  static async getAllFlashSales(filters?: {
    status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'APPROVE';
    start?: string; // ISO 8601
    end?: string; // ISO 8601
  }): Promise<FlashSaleCampaign[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start) params.append('start', filters.start);
      if (filters?.end) params.append('end', filters.end);

      const queryString = params.toString();
      const endpoint = `/api/campaigns/fast-sale${queryString ? `?${queryString}` : ''}`;

      const response = await HttpInterceptor.fetch<FlashSaleListResponse>(endpoint, {
        userType: 'customer'
      });

      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching flash sales:', error);
      throw new Error(error.message || 'Không thể tải danh sách Flash Sale');
    }
  }

  /**
   * 2. Lấy sản phẩm của một slot cụ thể
   * GET /api/campaigns/{campaignId}/slots/{slotId}/products
   * 
   * @param campaignId - ID của campaign
   * @param slotId - ID của slot
   * @param timeFilter - UPCOMING | ONGOING | EXPIRED
   */
  static async getSlotProducts(
    campaignId: string,
    slotId: string,
    timeFilter?: TimeFilter
  ): Promise<FlashSaleProduct[]> {
    try {
      const params = new URLSearchParams();
      if (timeFilter) params.append('timeFilter', timeFilter);

      const queryString = params.toString();
      const endpoint = `/api/campaigns/${campaignId}/slots/${slotId}/products${
        queryString ? `?${queryString}` : ''
      }`;

      const response = await HttpInterceptor.fetch<FlashSaleProductsResponse>(endpoint, {
        userType: 'customer'
      });

      return response.data?.items || [];
    } catch (error: any) {
      console.error('Error fetching slot products:', error);
      throw new Error(error.message || 'Không thể tải sản phẩm của khung giờ');
    }
  }

  /**
   * 3. Tìm slot hiện tại đang ACTIVE (openTime <= now <= closeTime)
   * Logic: Duyệt qua các campaign ACTIVE, tìm slot đầu tiên đang ACTIVE
   */
  static findCurrentActiveSlot(campaigns: FlashSaleCampaign[]): {
    campaign: FlashSaleCampaign;
    slot: FlashSaleSlot;
  } | null {
    const now = new Date();

    for (const campaign of campaigns) {
      // Chỉ xét campaign đang ACTIVE
      if (campaign.status !== 'ACTIVE') continue;

      for (const slot of campaign.slots) {
        const openTime = new Date(slot.openTime);
        const closeTime = new Date(slot.closeTime);

        // Check: openTime <= now <= closeTime
        if (openTime <= now && now <= closeTime && slot.status === 'ACTIVE') {
          return { campaign, slot };
        }
      }
    }

    return null;
  }

  /**
   * 4. Lấy slot hiện tại cùng với sản phẩm (15 sản phẩm đầu)
   * Kết hợp API 1 và API 2
   */
  static async getCurrentFlashSale(): Promise<CurrentFlashSaleSlot | null> {
    try {
      // Bước 1: Lấy tất cả Flash Sale đang ACTIVE
      const campaigns = await this.getAllFlashSales({ status: 'ACTIVE' });

      if (!campaigns || campaigns.length === 0) {
        return null;
      }

      // Bước 2: Tìm slot hiện tại
      const currentSlot = this.findCurrentActiveSlot(campaigns);

      if (!currentSlot) {
        return null;
      }

      // Bước 3: Lấy sản phẩm của slot (limit 15 sản phẩm cho home)
      const products = await this.getSlotProducts(
        currentSlot.campaign.id,
        currentSlot.slot.id,
        'ONGOING'
      );

      return {
        campaign: currentSlot.campaign,
        slot: currentSlot.slot,
        products: products.slice(0, 15) // Lấy 15 sản phẩm đầu
      };
    } catch (error: any) {
      console.error('Error getting current flash sale:', error);
      return null;
    }
  }

  /**
   * 5. Tính thời gian còn lại đến khi slot kết thúc
   * @param closeTime - ISO 8601 string
   * @returns { hours, minutes, seconds } hoặc null nếu đã hết hạn
   */
  static calculateTimeRemaining(closeTime: string): {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } | null {
    const now = new Date();
    const end = new Date(closeTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return null;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds };
  }

  /**
   * 6. Format thời gian còn lại thành string HH:MM:SS
   */
  static formatTimeRemaining(closeTime: string): string {
    const remaining = this.calculateTimeRemaining(closeTime);

    if (!remaining) {
      return '00:00:00';
    }

    const h = String(remaining.hours).padStart(2, '0');
    const m = String(remaining.minutes).padStart(2, '0');
    const s = String(remaining.seconds).padStart(2, '0');

    return `${h}:${m}:${s}`;
  }

  /**
   * 7. Lấy tất cả slots của một campaign (cho trang detail)
   * Trả về slots đã được sắp xếp theo thời gian
   */
  static async getCampaignSlots(campaignId: string): Promise<FlashSaleSlot[]> {
    try {
      // Lấy campaign từ danh sách
      const campaigns = await this.getAllFlashSales();
      const campaign = campaigns.find(c => c.id === campaignId);

      if (!campaign) {
        throw new Error('Không tìm thấy chiến dịch Flash Sale');
      }

      // Sắp xếp slots theo openTime
      return campaign.slots.sort((a, b) => {
        return new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
      });
    } catch (error: any) {
      console.error('Error fetching campaign slots:', error);
      throw new Error(error.message || 'Không thể tải khung giờ Flash Sale');
    }
  }

  /**
   * 8. Format giờ hiển thị (VD: "09:00")
   */
  static formatSlotTime(timeString: string): string {
    const date = new Date(timeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 9. Kiểm tra slot có đang diễn ra không
   */
  static isSlotActive(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);
    const closeTime = new Date(slot.closeTime);

    return openTime <= now && now <= closeTime && slot.status === 'ACTIVE';
  }

  /**
   * 10. Kiểm tra slot có sắp diễn ra không (chưa bắt đầu)
   */
  static isSlotUpcoming(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);

    return now < openTime && slot.status !== 'EXPIRED' && slot.status !== 'CLOSED';
  }

  /**
   * 11. Lấy label trạng thái slot
   */
  static getSlotStatusLabel(slot: FlashSaleSlot): string {
    if (this.isSlotActive(slot)) return 'Đang diễn ra';
    if (this.isSlotUpcoming(slot)) return 'Sắp diễn ra';
    if (slot.status === 'CLOSED' || slot.status === 'EXPIRED') return 'Đã kết thúc';
    return 'Không xác định';
  }

  /**
   * 12. Kiểm tra slot có phải ngày mai không
   */
  static isSlotTomorrow(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return openTime >= tomorrow && openTime < dayAfterTomorrow;
  }
}
