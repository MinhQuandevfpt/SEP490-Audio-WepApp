/**
 * Cart Types
 * Contains all type definitions for shopping cart functionality
 */

// ==================== CART TYPES ====================

// Cart Item Type
export type CartItemType = 'PRODUCT' | 'COMBO';

// Cart Status
export type CartStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

// Add to Cart Request
export interface AddToCartItem {
  type: CartItemType;
  productId?: string;  // Product ID (for products without variants)
  variantId?: string;  // Variant ID (for products with variants)
  comboId?: string;    // Combo ID (for combos)
  quantity: number;
}

export interface AddToCartRequest {
  items: AddToCartItem[];
}

// Cart Item Response
export interface CartItem {
  cartItemId: string;  // UUID
  type: CartItemType;
  refId: string;  // Reference to Product or Combo ID (UUID)
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;  // Giá hiện tại (đã áp dụng platform campaign nếu có)
  lineTotal: number;
  originProvinceCode?: string;
  originDistrictCode?: string;
  originWardCode?: string;
  variantId?: string;
  variantOptionName?: string;
  variantOptionValue?: string;
  variantUrl?: string;  // URL của ảnh variant (nếu có)
  // Platform campaign fields (from backend)
  baseUnitPrice?: number;  // Giá gốc (chưa campaign)
  platformCampaignPrice?: number;  // Giá sau campaign (nếu có)
  inPlatformCampaign?: boolean;  // Có đang nằm trong campaign không
  campaignUsageExceeded?: boolean;  // Đã vượt giới hạn sử dụng campaign chưa
}

// Cart Response
export interface CartResponse {
  cartId: string;  // UUID
  customerId: string;  // UUID
  status: CartStatus;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];
}

// Get Cart Response (same as CartResponse)
export type GetCartResponse = CartResponse;

// Add to Cart Response (same as CartResponse)
export type AddToCartResponse = CartResponse;

// ==================== CHECKOUT COD TYPES ====================

// Checkout COD Request Item
export interface CheckoutCodItem {
  productId?: string;  // Product ID (optional - not used if variantId is provided)
  variantId?: string;  // Variant ID (optional - used when cart item has variant)
  comboId?: string;    // Combo ID (optional - for combos)
  type: 'PRODUCT' | 'COMBO' | string;  // PRODUCT or COMBO
  quantity: number;
}

// Store Voucher
export interface StoreVoucher {
  storeId: string;
  codes: string[];
}

// Platform Voucher
export interface PlatformVoucher {
  campaignProductId: string;
  quantity: number;
}

// Service Type IDs - object với key là storeId và value là serviceTypeId
export type ServiceTypeIds = Record<string, number>;

// Checkout COD Request
export interface CheckoutCodRequest {
  items: CheckoutCodItem[];
  addressId: string;
  message?: string;  // Note from address
  storeVouchers?: StoreVoucher[];
  platformVouchers?: PlatformVoucher[] | null;
  serviceTypeIds?: ServiceTypeIds;
}

// Checkout COD Response Data
export interface CheckoutCodResponseData {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  grandTotal: number;
  storeDiscounts: Record<string, number>;
  receiverName: string;
  phoneNumber: string;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note: string | null;
}

// Checkout COD Response
export interface CheckoutCodResponse {
  status: number;
  message: string;
  data: CheckoutCodResponseData;
}

// ==================== CHECKOUT PAYOS TYPES ====================

// Checkout PayOS Request Item (same structure as COD)
export interface CheckoutPayOSItem {
  productId?: string;  // Product ID (optional - not used if variantId is provided)
  variantId?: string;  // Variant ID (optional - used when cart item has variant)
  comboId?: string;    // Combo ID (optional - for combos)
  type: 'PRODUCT' | 'COMBO' | string;  // PRODUCT or COMBO
  quantity: number;
}

// Checkout PayOS Request
export interface CheckoutPayOSRequest {
  addressId: string;
  message?: string;  // Note from address
  description?: string;
  items: CheckoutPayOSItem[];
  storeVouchers?: StoreVoucher[];
  platformVouchers?: PlatformVoucher[] | null;
  serviceTypeIds?: ServiceTypeIds;
  returnUrl: string;  // URL to redirect after successful payment
  cancelUrl: string;  // URL to redirect after failed payment
}

// Checkout PayOS Response Data
export interface CheckoutPayOSResponseData {
  customerOrderId: string;
  amount: number;
  payOSOrderCode: number;
  checkoutUrl: string;  // URL to redirect user to PayOS payment page
  qrCode: string;
  status: string;
}

// Checkout PayOS Response
export interface CheckoutPayOSResponse {
  status: number;
  message: string;
  data: CheckoutPayOSResponseData;
}

export default {};
