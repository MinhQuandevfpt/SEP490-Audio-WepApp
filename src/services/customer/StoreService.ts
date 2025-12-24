// Store Service for customer to get store information
import { HttpInterceptor } from '../HttpInterceptor';
import type { StoreDetail, StoreDetailResponse as SellerStoreDetailResponse } from '../../types/seller';

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

export interface StoreSearchItem {
  storeId: string;
  storeName: string;
  logoUrl?: string | null;
  email?: string;
  phoneNumber?: string;
  status: string;
  rating?: number | null;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  address?: string;
  addressId?: string;
}

export interface StoreSearchResponse {
  status: number;
  message: string;
  data: {
    stores: StoreSearchItem[];
    pagination: {
      totalElements: number;
      totalPages: number;
      pageSize: number;
      pageNumber: number;
    };
  };
}

export interface StoreDefaultAddressResponse {
  status: number;
  message: string;
  data: {
    addressId: string;
    defaultAddress: boolean;
    provinceCode: string;
    districtCode: string;
    wardCode: string;
    address: string;
    addressLocation: any | null;
  };
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
   * Get full store detail including addresses (using seller StoreDetail type)
   * This reuses the same /stores/{storeId} endpoint but exposes storeAddresses.
   */
  static async getStoreDetailWithAddresses(storeId: string): Promise<StoreDetail> {
    const response = await HttpInterceptor.get<SellerStoreDetailResponse>(
      `${API_URL}/stores/${storeId}`,
      {
        userType: 'customer',
      }
    );

    if (!response.data) {
      throw new Error('Store data not found');
    }

    return response.data;
  }

  /**
   * Get default store avatar if no avatar is provided
   */
  static getDefaultAvatar(storeName: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=128`;
  }

  /**
   * Search stores by keyword (prefix match)
   */
  static async searchStores(params: {
    keyword: string;
    page?: number;
    size?: number;
  }): Promise<StoreSearchResponse> {
    try {
      const { keyword, page = 0, size = 10 } = params;
      
      console.log('🔍 Searching stores with keyword:', keyword);

      const queryParams = new URLSearchParams({
        keyword,
        page: page.toString(),
        size: size.toString(),
      });

      const response = await HttpInterceptor.get<StoreSearchResponse>(
        `${API_URL}/stores/search?${queryParams.toString()}`,
        {
          userType: 'customer',
        }
      );

      console.log('✅ Store search results:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Error searching stores:', error);
      throw error;
    }
  }

  /**
   * Get default store address by product ID
   * This API returns the default address of the store that owns the product.
   * Used when store changes address but product hasn't been updated yet.
   * 
   * @param productId Product ID to get store default address
   * @returns Store default address with provinceCode, districtCode, wardCode
   */
  static async getStoreDefaultAddressByProduct(productId: string): Promise<StoreDefaultAddressResponse['data']> {
    try {
      console.log('🔍 Getting store default address for product:', productId);

      const response = await HttpInterceptor.get<StoreDefaultAddressResponse>(
        `${API_URL}/stores/address/default-by-product/${productId}`,
        {
          userType: 'customer',
        }
      );

      console.log('✅ Store default address received:', response.data);
      
      if (!response.data) {
        throw new Error('Store default address not found');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting store default address:', error);
      throw error;
    }
  }
}

