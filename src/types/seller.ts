// Seller Authentication Types
export interface SellerRegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface SellerRegisterResponse {
  status: number;
  message: string;
  data: {
    email: string;
    name: string;
    phone: string;
  };
}

export interface SellerLoginRequest {
  email: string;
  password: string;
}

export interface SellerLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: {
      email: string;
      fullName: string;
      role: string;
    };
    tokenType: string;
  };
}

export interface SellerUser {
  email: string;
  full_name: string;
  role: string;
}

// Seller KYC Types
export interface KycRequest {
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  isOfficial: boolean;
}

export interface KycResponse {
  id: string;
  version: number;
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  official: boolean;
}

// Store Status Types
export type StoreStatus = 'INACTIVE' | 'PENDING' | 'REJECTED' | 'ACTIVE';

export interface StoreInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: StoreStatus;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  kycInfo?: KycResponse;
  createdAt: string;
  updatedAt: string;
}

export interface StoreStatusResponse {
  status: StoreStatus;
  message: string;
  canAccessDashboard: boolean;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  revenueGrowth?: number;
  ordersGrowth?: number;
}

// Product Types for Seller
export interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: string;
  categoryName?: string;
  images: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  sold: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Order Types for Seller
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SellerOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  note?: string;
  createdAt: string;
  updatedAt: string;
}
