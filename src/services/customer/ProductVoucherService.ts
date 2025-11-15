import { HttpInterceptor } from '../HttpInterceptor';

export interface ProductVoucherResponse {
  status: number;
  message: string;
  data: {
    product: {
      productId: string;
      name: string;
      price: number;
      discountPrice: number | null;
      finalPrice: number;
      brandName: string;
      category: string;
      thumbnailUrl: string;
    };
    vouchers: {
      shop: Array<{
        source: 'SHOP';
        shopVoucherId: string;
        shopVoucherProductId: string;
        code: string;
        title: string;
        type: 'FIXED' | 'PERCENT';
        discountValue: number | null;
        discountPercent: number | null;
        maxDiscountValue: number | null;
        minOrderValue: number | null;
        startTime: string;
        endTime: string;
      }>;
      platform: Array<{
        campaignId: string;
        campaignType: string;
        code: string;
        name: string;
        description: string;
        badgeLabel: string;
        badgeColor: string;
        badgeIconUrl: string;
        status: string;
        startTime: string;
        endTime: string;
        vouchers: Array<{
          platformVoucherId: string;
          campaignId: string;
          type: 'FIXED' | 'PERCENT';
          discountValue: number | null;
          discountPercent: number | null;
          maxDiscountValue: number | null;
          minOrderValue: number | null;
          totalVoucherIssued: number;
          totalUsageLimit: number;
          usagePerUser: number;
          status: string;
          startTime: string;
          endTime: string;
        }>;
      }>;
    };
  };
}

export class ProductVoucherService {
  static isAuthenticated(): boolean {
    // Reuse customer token presence check via HttpInterceptor through RefreshTokenService
    return !!localStorage.getItem('CUSTOMER_token');
  }

  static async getProductVouchers(productId: string, type?: string | null, campaignType?: string | null): Promise<ProductVoucherResponse> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (campaignType) params.append('campaignType', campaignType);
    const qs = params.toString();
    const url = `/api/products/view/${productId}/vouchers${qs ? `?${qs}` : ''}`;
    return await HttpInterceptor.get<ProductVoucherResponse>(url, { userType: 'customer' });
  }
}

export default ProductVoucherService;


