import { HttpInterceptor } from '../HttpInterceptor';

// Prefer Vite proxy in development to avoid CORS entirely
const RESOLVED_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL ?? '/api');
const API_URL = RESOLVED_BASE.endsWith('/api') ? RESOLVED_BASE : `${RESOLVED_BASE}/api`;

export interface VoucherProductItem {
  productId: string;
  productName: string;
  promotionStockLimit: number | null;
  purchaseLimitPerCustomer: number | null;
  active: boolean;
}

export interface StoreVoucher {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'FIXED' | 'PERCENT';
  scopeType?: 'ALL_SHOP_VOUCHER' | 'PRODUCT_VOUCHER' | string;
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED' | 'DISABLED';
  startTime: string;
  endTime: string;
  totalVoucherIssued?: number | null;
  usagePerUser?: number | null;
  remainingUsage?: number | null;
  products: VoucherProductItem[];
}

export interface StoreVoucherListResponse {
  status: number;
  message: string;
  data: StoreVoucher[];
}

export interface CreateVoucherProductItem {
  productId: string;
  promotionStockLimit: number | null;
  purchaseLimitPerCustomer: number | null;
}

export interface CreateVoucherRequest {
  code: string;
  title: string;
  description: string;
  type: 'FIXED' | 'PERCENT';
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  totalVoucherIssued: number | null;
  totalUsageLimit: number | null;
  usagePerUser: number | null;
  startTime: string; // ISO
  endTime: string;   // ISO
  products: CreateVoucherProductItem[];
}

export interface CreateShopWideVoucherRequest {
  code: string;
  title: string;
  description: string;
  type: 'FIXED' | 'PERCENT';
  discountValue?: number | null;
  discountPercent?: number | null;
  maxDiscountValue?: number | null;
  minOrderValue?: number | null;
  startTime: string; // ISO
  endTime: string;   // ISO
}

export interface CreateVoucherResponse {
  status: number;
  message: string;
  data: StoreVoucher;
}

export class VoucherService {
  static async getShopVouchers(): Promise<StoreVoucherListResponse> {
    const url = `${API_URL}/shop-vouchers`;
    const data = await HttpInterceptor.get<StoreVoucherListResponse>(url, {
      headers: { 'Accept': 'application/json' },
      userType: 'seller'
    });
    return data;
  }

  static async createShopVoucher(body: CreateVoucherRequest): Promise<CreateVoucherResponse> {
    const url = `${API_URL}/shop-vouchers`;
    const data = await HttpInterceptor.post<CreateVoucherResponse>(url, body, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      userType: 'seller'
    });
    return data;
  }

  static async getShopVoucherById(id: string): Promise<{ status: number; message: string; data: StoreVoucher; }> {
    const url = `${API_URL}/shop-vouchers/${id}`;
    const data = await HttpInterceptor.get<{ status: number; message: string; data: StoreVoucher; }>(url, {
      headers: { 'Accept': 'application/json' },
      userType: 'seller'
    });
    return data;
  }

  static async toggleShopVoucher(id: string): Promise<{ status: number; message: string; data: StoreVoucher; }> {
    const url = `${API_URL}/shop-vouchers/${id}/toggle`;
    const data = await HttpInterceptor.patch<{ status: number; message: string; data: StoreVoucher; }>(url, undefined as any, {
      headers: { 'Accept': 'application/json' },
      userType: 'seller'
    });
    return data;
  }

  static async createShopWideVoucher(body: CreateShopWideVoucherRequest): Promise<CreateVoucherResponse> {
    const url = `${API_URL}/shop-vouchers/shop-wide`;
    const data = await HttpInterceptor.post<CreateVoucherResponse>(url, body, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      userType: 'seller'
    });
    return data;
  }

  // Get shop-wide vouchers by store for customer checkout
  static async getShopVouchersByStore(
    storeId: string,
    status: string = 'ACTIVE',
    scopeType: string = 'ALL_SHOP_VOUCHER'
  ): Promise<StoreVoucherListResponse> {
    const url = `${API_URL}/shop-vouchers/by-store`;
    const params = new URLSearchParams({
      storeId,
      status,
      scopeType,
    });
    const data = await HttpInterceptor.get<StoreVoucherListResponse>(`${url}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      userType: 'customer'
    });
    return data;
  }

  // Get filtered shop vouchers (for seller)
  static async getFilteredShopVouchers(
    status: string = 'ACTIVE',
    scopeType: string = 'ALL_SHOP_VOUCHER'
  ): Promise<StoreVoucherListResponse> {
    const url = `${API_URL}/shop-vouchers/filter`;
    const params = new URLSearchParams({
      status,
      scopeType,
    });
    const data = await HttpInterceptor.get<StoreVoucherListResponse>(`${url}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      userType: 'seller'
    });
    return data;
  }
}


