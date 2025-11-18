/**
 * Customer Cart Service
 * Handles shopping cart operations for customers
 */

import { HttpInterceptor } from '../HttpInterceptor';
import { CustomerAuthService } from './Authcustomer';
import type {
  AddToCartRequest,
  AddToCartResponse,
  CartResponse,
  CheckoutCodRequest,
  CheckoutCodResponse,
  CheckoutPayOSRequest,
  CheckoutPayOSResponse
} from '../../types/cart';
import { getCustomerId } from '../../utils/authHelper';

export class CustomerCartService {
  /**
   * Get customer ID from localStorage (using authHelper)
   */
  private static getCustomerId(): string {
    const customerId = getCustomerId();
    if (!customerId) {
      throw new Error('Customer ID not found. Please login again.');
    }
    return customerId;
  }

  /**
   * Update quantity of a specific cart item
   * PATCH /api/v1/customers/{customerId}/cart/item/quantity
   */
  static async updateItemQuantity(cartItemId: string, quantity: number): Promise<CartResponse> {
    try {
      const customerId = this.getCustomerId();
      const response = await HttpInterceptor.patch<CartResponse>(
        `/api/v1/customers/${customerId}/cart/item/quantity`,
        { cartItemId, quantity },
        { userType: 'customer' }
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to update cart item quantity:', error);
      throw error;
    }
  }

  /**
   * Delete one or multiple cart items
   * DELETE /api/v1/customers/{customerId}/cart/items
   */
  static async deleteItems(cartItemIds: string[]): Promise<CartResponse> {
    try {
      const customerId = this.getCustomerId();
      const response = await HttpInterceptor.deleteWithBody<CartResponse>(
        `/api/v1/customers/${customerId}/cart/items`,
        { cartItemIds },
        { userType: 'customer' }
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to delete cart items:', error);
      throw error;
    }
  }

  /**
   * Get current cart for customer
   * GET /api/v1/customers/{customerId}/cart
   */
  static async getCart(): Promise<CartResponse> {
    try {
      const customerId = this.getCustomerId();
      console.log('🛒 Fetching cart for customer:', customerId);

      const response = await HttpInterceptor.get<CartResponse>(
        `/api/v1/customers/${customerId}/cart`,
        { userType: 'customer' }
      );

      console.log('✅ Cart fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch cart:', error);
      throw error;
    }
  }

  /**
   * Add items to cart
   * POST /api/v1/customers/{customerId}/cart/items
   * 
   * @param items - Array of items to add (products or combos)
   * @returns Updated cart with all items
   */
  static async addToCart(items: AddToCartRequest['items']): Promise<AddToCartResponse> {
    try {
      const customerId = this.getCustomerId();
      console.log('🛒 Adding items to cart:', { customerId, items });
      console.log('📦 Request payload:', JSON.stringify({ items }, null, 2));

      const response = await HttpInterceptor.post<AddToCartResponse>(
        `/api/v1/customers/${customerId}/cart/items`,
        { items },
        { userType: 'customer' }
      );

      console.log('✅ Items added to cart successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to add items to cart:', error);
      throw error;
    }
  }

  /**
   * Add a single product to cart (convenience method)
   * 
   * @param productId - Product UUID
   * @param quantity - Quantity to add (default: 1)
   * @param variantId - Optional variant ID for products with variants
   */
  static async addProductToCart(
    productId: string, 
    quantity: number = 1, 
    variantId?: string
  ): Promise<AddToCartResponse> {
    const item: any = {
      type: 'PRODUCT',
      quantity
    };
    
    // Backend requires EITHER productId OR variantId, not both
    if (variantId) {
      // Product has variant - send variantId only
      item.variantId = variantId;
      console.log('🎯 Adding product variant to cart:', { variantId, quantity });
    } else {
      // Product has no variant - send productId only
      item.productId = productId;
      console.log('📦 Adding product without variant:', { productId, quantity });
    }
    
    return this.addToCart([item]);
  }

  /**
   * Add a single combo to cart (convenience method)
   * 
   * @param comboId - Combo UUID
   * @param quantity - Quantity to add (default: 1)
   */
  static async addComboToCart(comboId: string, quantity: number = 1): Promise<AddToCartResponse> {
    return this.addToCart([
      {
        type: 'COMBO',
        comboId: comboId,
        quantity
      }
    ]);
  }

  /**
   * Get cart item count (total quantity of all items)
   */
  static async getCartItemCount(): Promise<number> {
    try {
      const cart = await this.getCart();
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      return totalItems;
    } catch (error) {
      console.error('❌ Failed to get cart item count:', error);
      return 0;
    }
  }

  /**
   * Check if customer is authenticated before cart operations
   */
  static isAuthenticated(): boolean {
    return CustomerAuthService.isAuthenticated();
  }

  /**
   * Checkout with COD (Cash on Delivery)
   * POST /api/v1/customers/{customerId}/cart/checkout-cod
   * 
   * @param request - Checkout COD request with items, addressId, message, storeVouchers
   * @returns Checkout COD response with order details
   */
  static async checkoutCod(request: CheckoutCodRequest): Promise<CheckoutCodResponse> {
    try {
      const customerId = this.getCustomerId();
      console.log('💳 Processing COD checkout:', { customerId, request });

      const response = await HttpInterceptor.post<CheckoutCodResponse>(
        `/api/v1/customers/${customerId}/cart/checkout-cod`,
        request,
        { userType: 'customer' }
      );

      console.log('✅ COD checkout successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to checkout COD:', error);
      throw error;
    }
  }

  /**
   * Checkout with PayOS
   * POST /api/v1/payos/checkout?customerId={customerId}
   * 
   * @param request - Checkout PayOS request with items, addressId, message, returnUrl, cancelUrl
   * @returns Checkout PayOS response with checkoutUrl
   */
  static async checkoutPayOS(request: CheckoutPayOSRequest): Promise<CheckoutPayOSResponse> {
    try {
      const customerId = this.getCustomerId();
      console.log('💳 Processing PayOS checkout:', { customerId, request });

      const response = await HttpInterceptor.post<CheckoutPayOSResponse>(
        `/api/v1/payos/checkout?customerId=${customerId}`,
        request,
        { userType: 'customer' }
      );

      console.log('✅ PayOS checkout successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to checkout PayOS:', error);
      throw error;
    }
  }

  /**
   * Format cart error message
   */
  static formatCartError(error: any): string {
    if (error?.status === 400) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (error?.status === 404) {
      return 'Không tìm thấy sản phẩm hoặc combo. Vui lòng thử lại.';
    }
    if (error?.status === 401) {
      return 'Vui lòng đăng nhập để thêm vào giỏ hàng.';
    }
    return error?.message || 'Đã xảy ra lỗi khi thao tác với giỏ hàng.';
  }

  /**
   * Delete entire cart
   * DELETE /api/v1/customers/{customerId}/cart
   */
  static async deleteCart(): Promise<CartResponse> {
    try {
      const customerId = this.getCustomerId();
      const response = await HttpInterceptor.delete<CartResponse>(
        `/api/v1/customers/${customerId}/cart`,
        { userType: 'customer' }
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to delete cart:', error);
      throw error;
    }
  }
}

export default CustomerCartService;
