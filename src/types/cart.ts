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

export default {};
