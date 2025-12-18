/**
 * Custom hook for managing shopping cart
 */
import { useState, useEffect, useCallback } from 'react';
import { CustomerCartService } from '../services/customer/CartService';
import type { CartResponse } from '../types/cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load full cart
  const loadCart = useCallback(async () => {
    if (!CustomerCartService.isAuthenticated()) {
      setCart(null);
      setCartItemCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cartData = await CustomerCartService.getCart();
      setCart(cartData);
      
      // Calculate total items
      const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (err: any) {
      console.error('Failed to load cart:', err);
      setError(CustomerCartService.formatCartError(err));
      setCart(null);
      setCartItemCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load only cart count (lighter operation)
  const loadCartCount = useCallback(async () => {
    if (!CustomerCartService.isAuthenticated()) {
      setCartItemCount(0);
      return;
    }

    try {
      const count = await CustomerCartService.getCartItemCount();
      setCartItemCount(count);
    } catch (err) {
      console.error('Failed to load cart count:', err);
      setCartItemCount(0);
    }
  }, []);

  // Add product to cart
  const addProduct = useCallback(async (productId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedCart = await CustomerCartService.addProductToCart(productId, quantity);
      setCart(updatedCart);
      
      // Update cart count
      const totalItems = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
      
      return updatedCart;
    } catch (err: any) {
      const errorMsg = CustomerCartService.formatCartError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add combo to cart
  const addCombo = useCallback(async (comboId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedCart = await CustomerCartService.addComboToCart(comboId, quantity);
      setCart(updatedCart);
      
      // Update cart count
      const totalItems = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
      
      return updatedCart;
    } catch (err: any) {
      const errorMsg = CustomerCartService.formatCartError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cart (reset state)
  const clearCart = useCallback(() => {
    setCart(null);
    setCartItemCount(0);
    setError(null);
  }, []);

  // Delete one or multiple cart items
  const removeItems = useCallback(
    async (cartItemIds: string[]) => {
      if (!cartItemIds || cartItemIds.length === 0) return;

      try {
        setIsLoading(true);
        setError(null);

        console.groupCollapsed(
          '🗑 [useCart.removeItems] DELETE /api/v1/customers/{customerId}/cart/items'
        );
        console.log('Request Body:', { cartItemIds });

        const updatedCart = await CustomerCartService.deleteItems(cartItemIds);

        console.log('Response Body:', updatedCart);
        console.groupEnd();

        setCart(updatedCart);
        const totalItems = updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setCartItemCount(totalItems);
      } catch (err: any) {
        console.error('Failed to delete cart items:', err);
        const errorMsg = CustomerCartService.formatCartError(err);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update quantity for a specific cart item using quantity-with-vouchers API
  // NOTE: This is a simplified version that does NOT send any vouchers/serviceTypeIds.
  // It is suitable for basic +/- quantity controls (e.g. in ShopCartV2).
  const updateQuantity = useCallback(
    async (cartItemId: string, nextQuantity: number) => {
      try {
        // Clamp quantity to a sensible range to avoid invalid values
        const clamped = Math.max(1, Math.min(nextQuantity, 99));

        setIsLoading(true);
        setError(null);

        const requestPayload = {
          cartItemId,
          quantity: clamped,
          storeVouchers: null,
          platformVouchers: null,
          serviceTypeIds: null,
        };

        console.groupCollapsed(
          '🛒 [useCart.updateQuantity] POST /api/v1/customers/{customerId}/cart/items/quantity-with-vouchers'
        );
        console.log('Request Body:', requestPayload);

        const updatedCart = await CustomerCartService.updateQuantityWithVouchers(
          requestPayload
        );

        console.log('Response Body:', updatedCart);
        console.groupEnd();

        setCart(updatedCart);
        const totalItems = updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setCartItemCount(totalItems);
      } catch (err: any) {
        console.error('Failed to update cart quantity:', err);
        const errorMsg = CustomerCartService.formatCartError(err);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto-load cart count on mount if authenticated
  useEffect(() => {
    if (CustomerCartService.isAuthenticated()) {
      loadCartCount();
    }
  }, [loadCartCount]);

  return {
    cart,
    cartItemCount,
    isLoading,
    error,
    loadCart,
    loadCartCount,
    addProduct,
    addCombo,
    clearCart,
    updateQuantity,
    removeItems,
  };
};

export default useCart;
