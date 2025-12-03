import HttpInterceptor from '../HttpInterceptor';

// Params for /api/products/view
export interface ProductViewParams {
  status?: string;
  categoryId?: string;
  storeId?: string;
  keyword?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  page?: number;
  size?: number;
}

export interface ProductViewStoreInfo {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
}

// Platform Voucher (Flash Sale, etc.)
export interface PlatformVoucherDetail {
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
  flashSlotId?: string;
  slotOpenTime?: string;
  slotCloseTime?: string;
  slotStatus?: string;
}

export interface PlatformCampaign {
  campaignId: string;
  code: string;
  name: string;
  description: string;
  campaignType: 'FAST_SALE' | string;
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  status: string;
  allowRegistration: boolean;
  approvalRule: string | null;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdBy: string | null;
  vouchers: PlatformVoucherDetail[];
}

// Shop Voucher
export interface ShopVoucherDetail {
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
}

// Product Vouchers container
export interface ProductVouchers {
  platformVouchers?: PlatformCampaign[];
  shopVoucher?: ShopVoucherDetail;
}

// Product Variant in view
export interface ProductViewVariant {
  variantId: string;
  optionName: string;
  optionValue: string;
  variantSku: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export interface ProductViewItem {
  productId: string;
  name: string;
  brandName: string | null;
  price: number | null;
  discountPrice: number | null;
  finalPrice: number | null;
  category: string | null;
  thumbnailUrl: string | null;
  ratingAverage: number | null;
  reviewCount: number | null;
  variants?: ProductViewVariant[];
  store: ProductViewStoreInfo | null;
  vouchers?: ProductVouchers;
}

export interface ProductViewPageInfo {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

export interface ProductViewApiResponse {
  status: number;
  message: string;
  data: {
    data: ProductViewItem[];
    page: ProductViewPageInfo;
  };
}

// Voucher types for product detail vouchers API
export interface ProductVoucherItem {
  source: 'SHOP' | 'PLATFORM' | string;
  shopVoucherId?: string;
  shopVoucherProductId?: string;
  code: string;
  title: string;
  type: 'FIXED' | 'PERCENT' | string;
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  startTime: string;
  endTime: string;
}

// Platform campaign for product detail vouchers
export interface ProductDetailPlatformVoucher {
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
  flashSlotId?: string;
  slotOpenTime?: string;
  slotCloseTime?: string;
  slotStatus?: string;
}

export interface ProductDetailPlatformCampaign {
  campaignId: string;
  campaignType: 'FAST_SALE' | string;
  code: string;
  name: string;
  description: string;
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  status: string;
  startTime: string;
  endTime: string;
  vouchers: ProductDetailPlatformVoucher[];
}

export interface ProductVoucherProductSummary {
  productId: string;
  name: string;
  price: number | null;
  discountPrice: number | null;
  finalPrice: number | null;
  brandName: string | null;
  category: string | null;
  thumbnailUrl: string | null;
}

export interface ProductVouchersResponse {
  status: number;
  message: string;
  data: {
    product: ProductVoucherProductSummary;
    vouchers: {
      shop?: ProductVoucherItem[];
      platform?: ProductDetailPlatformCampaign[];
    };
  };
}

export class ProductViewService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return baseUrl.endsWith('/api') ? `${baseUrl}/products/view` : `${baseUrl}/api/products/view`;
  }

  static async getProductViews(params: ProductViewParams = {}): Promise<ProductViewApiResponse> {
    const query = new URLSearchParams();

    if (params.status) query.append('status', params.status);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.storeId) query.append('storeId', params.storeId);
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.provinceCode) query.append('provinceCode', params.provinceCode);
    if (params.districtCode) query.append('districtCode', params.districtCode);
    if (params.wardCode) query.append('wardCode', params.wardCode);
    query.append('page', String(params.page ?? 0));
    query.append('size', String(params.size ?? 20));

    const endpoint = `${this.BASE_URL}?${query.toString()}`;
    // Use customer context for token if present
    return await HttpInterceptor.get<ProductViewApiResponse>(endpoint, { userType: 'customer' });
  }

  static async getProductVouchers(
    productId: string,
    params: { type?: string; campaignType?: string } = {}
  ): Promise<ProductVouchersResponse> {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.campaignType) query.append('campaignType', params.campaignType);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const endpoint = `${this.BASE_URL}/${productId}/vouchers${suffix}`;
    return await HttpInterceptor.get<ProductVouchersResponse>(endpoint, { userType: 'customer' });
  }
}

export default ProductViewService;
