/**
 * Mock Checkout Service
 * Simulates loading checkout data and submitting order
 */

import type { CheckoutAddress, CheckoutCartItem, ShippingMethod, PaymentMethod } from '../../data/checkout';
import { dummyAddresses, dummyCartItems, calcCheckoutSummary } from '../../data/checkout';

export interface CheckoutData {
  addresses: CheckoutAddress[];
  items: CheckoutCartItem[];
}

export class CheckoutService {
  static async loadCheckout(): Promise<CheckoutData> {
    await new Promise(r => setTimeout(r, 300));
    return {
      addresses: dummyAddresses,
      items: dummyCartItems,
    };
  }

  static async estimateShipping(method: ShippingMethod): Promise<number> {
    await new Promise(r => setTimeout(r, 150));
    if (method === 'express') return 30000;
    if (method === 'economy') return 10000;
    return 15000;
  }

  static async submitOrder(params: {
    addressId: string;
    paymentMethod: PaymentMethod;
    shippingMethod: ShippingMethod;
  }): Promise<{ orderId: string; total: number }>{
    await new Promise(r => setTimeout(r, 600));
    const shippingFee = await this.estimateShipping(params.shippingMethod);
    const total = calcCheckoutSummary(dummyCartItems, shippingFee).total;
    return { orderId: 'OD' + Date.now(), total };
  }
}

export default CheckoutService;


