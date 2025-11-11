/**
 * Mock Checkout Service
 * Simulates loading checkout data and submitting order
 */

import type { CheckoutAddress, CheckoutCartItem, ShippingMethod, PaymentMethod } from '../../data/checkout';
import { dummyAddresses, dummyCartItems, calcCheckoutSummary } from '../../data/checkout';
import { HttpInterceptor } from '../HttpInterceptor';
import type { ApiResponse, PayOSCheckoutRequestBody, PayOSCheckoutResponse } from '../../types/api';

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

  /**
   * Create PayOS checkout session (real API)
   * POST /api/v1/payos/checkout?customerId=...
   */
  static async createPayOSCheckout(
    customerId: string,
    body: PayOSCheckoutRequestBody
  ): Promise<PayOSCheckoutResponse> {
    const endpoint = `/api/v1/payos/checkout?customerId=${encodeURIComponent(customerId)}`;
    const res = await HttpInterceptor.post<ApiResponse>(endpoint, body, { userType: 'customer' });
    // Normalize to typed response
    return res as PayOSCheckoutResponse;
  }
}

export default CheckoutService;


