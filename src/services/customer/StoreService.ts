// Store Service for customer to get store information
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export interface StoreDetailResponse {
  storeId: string;
  storeName: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rating?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomerStoreService {
  /**
   * Get store detail by store ID (public endpoint for customers)
   */
  static async getStoreById(storeId: string): Promise<StoreDetailResponse> {
    try {
      console.log('🔍 Getting store detail for ID:', storeId);

      const response = await HttpInterceptor.get<{ data: StoreDetailResponse }>(
        `${API_URL}/stores/${storeId}`,
        {
          userType: 'customer',
        }
      );

      console.log('✅ Store detail received:', response.data);
      
      if (!response.data) {
        throw new Error('Store data not found');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting store detail:', error);
      throw error;
    }
  }

  /**
   * Get default store avatar if no avatar is provided
   */
  static getDefaultAvatar(storeName: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=128`;
  }
}

