// Shop Stats Service for Seller Dashboard
import type { ShopStatsRangeResponse } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';
import { StoreService } from './StoreService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class ShopStatsService {
  /**
   * Get shop statistics for a date range
   * GET /api/v1/shop-stats/{storeId}/range
   * 
   * @param storeId - Store ID (UUID)
   * @param from - Start date (yyyy-MM-dd)
   * @param to - End date (yyyy-MM-dd)
   */
  static async getShopStatsRange(
    storeId: string,
    from: string,
    to: string
  ): Promise<ShopStatsRangeResponse> {
    try {
      console.log('🔍 Fetching shop stats range:', { storeId, from, to });

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('from', from);
      queryParams.append('to', to);

      const url = `${API_URL}/v1/shop-stats/${storeId}/range?${queryParams.toString()}`;
      console.log('📡 API URL:', url);

      const data = await HttpInterceptor.get<ShopStatsRangeResponse>(url, {
        headers: {
          'Accept': 'application/json',
        },
        userType: 'seller',
      });

      console.log('✅ Shop stats received:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching shop stats:', error);
      throw error;
    }
  }

  /**
   * Get shop statistics for current store with date range
   * Automatically gets store ID from StoreService
   */
  static async getShopStatsRangeForCurrentStore(
    from: string,
    to: string
  ): Promise<ShopStatsRangeResponse> {
    try {
      const storeId = await StoreService.getStoreId();
      return this.getShopStatsRange(storeId, from, to);
    } catch (error) {
      console.error('❌ Error getting shop stats for current store:', error);
      throw error;
    }
  }
}

