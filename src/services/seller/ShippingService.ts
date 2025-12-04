// Shipping Service for Seller Dashboard
import type { ShippingMethodListResponse } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class ShippingService {
  /**
   * Get all shipping methods
   * GET /api/shipping-methods
   */
  static async getShippingMethods(): Promise<ShippingMethodListResponse> {
    try {
      const url = `${API_URL}/shipping-methods`;
      console.log('🔍 Fetching shipping methods from:', url);
      const data = await HttpInterceptor.get<ShippingMethodListResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
        userType: 'seller',
      });
      console.log('✅ Shipping methods received:', {
        status: data.status,
        message: data.message,
        count: data.data?.length || 0
      });

      // Ensure data.data is an array
      if (!data || typeof data !== 'object' || !Array.isArray(data.data)) {
        console.warn('⚠️ API returned unexpected data structure for shipping methods, setting empty array');
        data.data = [];
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching shipping methods:', error);
      throw error;
    }
  }
}
