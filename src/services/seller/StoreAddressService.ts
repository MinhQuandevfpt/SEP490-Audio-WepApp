import { HttpInterceptor } from '../HttpInterceptor';
import type { StoreAddressListResponse, CreateStoreAddressRequest, CreateStoreAddressResponse } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class StoreAddressService {
  /**
   * Get all addresses for current store
   * @returns List of store addresses
   */
  static async getStoreAddresses(): Promise<StoreAddressListResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/addresses`;
      
      console.log('📡 Calling store addresses API:', endpoint);
      
      const response = await HttpInterceptor.get<StoreAddressListResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Store addresses API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      // If response is already an array
      if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting store addresses:', error);
      throw new Error(error?.message || 'Không thể tải danh sách địa chỉ cửa hàng');
    }
  }

  /**
   * Create a new store address
   * @param request Address creation request
   * @returns List of store addresses (including the newly created one)
   */
  static async createStoreAddress(request: CreateStoreAddressRequest): Promise<CreateStoreAddressResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/addresses`;
      
      console.log('📡 Calling create store address API:', endpoint);
      console.log('📤 Request body:', request);
      
      const response = await HttpInterceptor.post<CreateStoreAddressResponse>(
        endpoint,
        request,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 Create store address API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      // If response is already an array
      if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error creating store address:', error);
      throw new Error(error?.message || 'Không thể tạo địa chỉ cửa hàng');
    }
  }

  /**
   * Set an address as default
   * @param addressId Address ID to set as default
   * @returns List of store addresses with updated default status
   */
  static async setDefaultAddress(addressId: string): Promise<StoreAddressListResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/addresses/${addressId}/default`;
      
      console.log('📡 Calling set default address API:', endpoint);
      
      const response = await HttpInterceptor.patch<StoreAddressListResponse>(
        endpoint,
        {},
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 Set default address API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      // If response is already an array
      if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error setting default address:', error);
      throw new Error(error?.message || 'Không thể đặt địa chỉ mặc định');
    }
  }

  /**
   * Delete a store address
   * @param addressId Address ID to delete
   * @returns List of remaining store addresses
   */
  static async deleteStoreAddress(addressId: string): Promise<StoreAddressListResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/addresses/${addressId}`;
      
      console.log('📡 Calling delete store address API:', endpoint);
      
      const response = await HttpInterceptor.delete<StoreAddressListResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Delete store address API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      // If response is already an array
      if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error deleting store address:', error);
      throw new Error(error?.message || 'Không thể xóa địa chỉ cửa hàng');
    }
  }
}

