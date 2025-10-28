/**
 * Cart Context Provider
 * Provides cart state and actions throughout the app
 */
import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCart } from '../hooks/useCart';
import type { CartResponse } from '../types/cart';

interface CartContextType {
  cart: CartResponse | null;
  cartItemCount: number;
  isLoading: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  loadCartCount: () => Promise<void>;
  addProduct: (productId: string, quantity?: number) => Promise<CartResponse>;
  addCombo: (comboId: string, quantity?: number) => Promise<CartResponse>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cartData = useCart();

  return (
    <CartContext.Provider value={cartData}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
