/**
 * Flash Sale Types
 * API: /api/campaigns/fast-sale và /api/campaigns/{campaignId}/slots/{slotId}/products
 */

export type FlashSaleStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'APPROVE';
export type SlotStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
export type VoucherType = 'FIXED' | 'PERCENT';
export type TimeFilter = 'UPCOMING' | 'ONGOING' | 'EXPIRED';

/**
 * Flash Sale Slot - Khung giờ của chiến dịch
 */
export interface FlashSaleSlot {
  id: string;
  openTime: string; // ISO 8601
  closeTime: string; // ISO 8601
  status: SlotStatus;
}

/**
 * Flash Sale Campaign
 */
export interface FlashSaleCampaign {
  id: string;
  code: string;
  name: string;
  description: string;
  campaignType: 'FAST_SALE';
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  allowRegistration: boolean;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: FlashSaleStatus;
  slots: FlashSaleSlot[];
}

/**
 * Flash Sale Product - Sản phẩm trong slot
 */
export interface FlashSaleProduct {
  campaignProductId: string;
  productId: string;
  productName: string;
  brandName: string;
  originalPrice: number;
  discountedPrice: number;
  type: VoucherType;
  discountValue: number;
  discountPercent: number;
  maxDiscountValue: number;
  minOrderValue: number;
  totalVoucherIssued: number;
  totalUsageLimit: number;
  usagePerUser: number;
  remainingUsage: number;
  startTime: string;
  endTime: string;
  status: FlashSaleStatus;
  imageUrl?: string; // Có thể cần thêm từ product detail
}

/**
 * API Response - GET /api/campaigns/fast-sale
 */
export interface FlashSaleListResponse {
  status: number;
  message: string;
  data: FlashSaleCampaign[];
}

/**
 * API Response - GET /api/campaigns/{campaignId}/slots/{slotId}/products
 */
export interface FlashSaleProductsResponse {
  status: number;
  message: string;
  data: {
    campaignId: string;
    slotId: string;
    timeFilter: TimeFilter | null;
    items: FlashSaleProduct[];
  };
}

/**
 * Helper type - Slot hiện tại với thông tin campaign
 */
export interface CurrentFlashSaleSlot {
  campaign: FlashSaleCampaign;
  slot: FlashSaleSlot;
  products: FlashSaleProduct[];
}
