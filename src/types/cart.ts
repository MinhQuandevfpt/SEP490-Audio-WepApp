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
  id: string;  // Product ID or Combo ID (UUID)
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
  unitPrice: number;
  lineTotal: number;
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
  id: string;  // Product ID (productId)
  type: 'PRODUCT' | 'COMBO';  // Default: PRODUCT
  quantity: number;
}

// Store Voucher
export interface StoreVoucher {
  storeId: string;
  codes: string[];
}

// Checkout COD Request
export interface CheckoutCodRequest {
  items: CheckoutCodItem[];
  addressId: string;
  message?: string;  // Note from address
  storeVouchers?: StoreVoucher[];
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
  id: string;  // Product ID (productId)
  type: 'PRODUCT' | 'COMBO';  // Default: PRODUCT
  quantity: number;
}

// Checkout PayOS Request
export interface CheckoutPayOSRequest {
  addressId: string;
  message?: string;  // Note from address
  description?: string;
  items: CheckoutPayOSItem[];
  storeVouchers?: StoreVoucher[];
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
