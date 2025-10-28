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
  };
};

export default useCart;
