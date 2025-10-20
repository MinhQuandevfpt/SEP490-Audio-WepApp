// Shipping Service for Seller Dashboard
import type { ShippingMethodListResponse } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class ShippingService {
  /**
   * Get all shipping methods
   * GET /api/shipping-methods
   */
  static async getShippingMethods(): Promise<ShippingMethodListResponse> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const url = `${API_URL}/shipping-methods`;
      console.log('🔍 Fetching shipping methods from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Shipping methods response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Shipping methods error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
