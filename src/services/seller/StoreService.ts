// Store Service for managing store information and status
import type { StoreInfo, StoreStatusResponse, StoreDetailResponse, StoreDetail, UpdateStoreRequest, UpdateStoreResponse } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';
import { getSellerStoreId, safeSetLocalStorage } from '../../utils/authHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class StoreService {
  /**
   * Get current store information including status
   */
  static async getStoreInfo(): Promise<StoreInfo> {
    try {
      // Get store ID first (from cache or API)
      const storeId = await this.getStoreId();
      console.log('🔍 Getting store info for ID:', storeId);

      // Use store ID to get store details
      const data = await HttpInterceptor.get<any>(`${API_URL}/stores/${storeId}`, {
        headers: {
          'Accept': '*/*',
        },
        userType: 'seller',
      });
      console.log('✅ Store info received:', data);
      
      // Handle different response formats
      // Backend might return: { data: {...} } or just {...}
      const storeInfo = data.data || data;
      
      // Cache store info
      localStorage.setItem('seller_store_info', JSON.stringify(storeInfo));
      
      // Also cache store ID if available
      // Backend uses 'storeId' field
      if (storeInfo.storeId || storeInfo.id) {
        localStorage.setItem('seller_store_id', storeInfo.storeId || storeInfo.id);
      }
      
      return storeInfo;
    } catch (error) {
      console.error('❌ Error getting store info:', error);
      throw error;
    }
  }

  /**
   * Get store ID with improved caching and error handling
   */
  static async getStoreId(): Promise<string> {
    try {
      // First, try to get store ID using helper (checks both cache and seller_user)
      let cachedStoreId = getSellerStoreId();
      
      if (cachedStoreId) {
        console.log('✅ Using cached store ID:', cachedStoreId);
        return cachedStoreId;
      }
      
      console.log('🔄 Fetching store ID from API...');
      
      // Use the official API endpoint to get store ID (with auto token refresh)
      const storeData = await HttpInterceptor.get<any>(`${API_URL}/stores/me/id`, {
        headers: {
          'Accept': '*/*',
        },
        userType: 'seller',
      });
      
      // According to the API response, the storeId is in the 'data' field
      const storeId = storeData.data;
      
      if (!storeId) {
        console.error('❌ Store ID not found in API response:', storeData);
        throw new Error('Không tìm thấy store ID. Vui lòng đăng nhập lại.');
      }

      console.log('✅ Store ID fetched from API:', storeId);
      
      // Cache the store ID using safe setter
      safeSetLocalStorage('seller_store_id', storeId);
      
      return storeId;
    } catch (error: any) {
      console.error('❌ Error getting store ID:', error);
      
      // If 404, user might not have a store yet
      if (error?.status === 404) {
        throw new Error('Bạn chưa có cửa hàng. Vui lòng hoàn tất thông tin KYC.');
      }
      
      // If 401, token might be invalid - clear and redirect
      if (error?.status === 401) {
        this.clearStoreCache();
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      
      throw error;
    }
  }

  /**
   * Get store status (INACTIVE, PENDING, REJECTED, ACTIVE)
   */
  static async getStoreStatus(): Promise<StoreStatusResponse> {
    try {
      // Try to get store info first
      try {
        const storeInfo = await this.getStoreInfo();
        
        return {
          status: storeInfo.status,
          message: this.getStatusMessage(storeInfo.status),
          canAccessDashboard: storeInfo.status === 'ACTIVE'
        };
      } catch (storeError) {
        console.warn('⚠️ Could not get store info, trying KYC status:', storeError);
        
        // Fallback: Try to get KYC status
        const kycStatus = await this.getKycStatus();
        if (kycStatus) {
          return kycStatus;
        }
        
        throw storeError;
      }
    } catch (error) {
      console.error('❌ Error getting store status:', error);
      // If all fails, assume INACTIVE status
      return {
        status: 'INACTIVE',
        message: 'Bạn chưa hoàn thành thông tin KYC',
        canAccessDashboard: false
      };
    }
  }

  /**
   * Get KYC status as fallback
   */
  static async getKycStatus(): Promise<StoreStatusResponse | null> {
    try {
      const storeId = await this.getStoreId();
      
      // Try to get KYC info
      try {
        const kycData = await HttpInterceptor.get<any>(`${API_URL}/stores/${storeId}/kyc`, {
          headers: {
            'Accept': '*/*',
          },
          userType: 'seller',
        });

        let kyc = kycData.data || kycData;
        if (Array.isArray(kyc)) {
          kyc = kyc[0];
        }
        if (!kyc) {
          return null;
        }
        console.log('✅ KYC status from API:', kyc.status);

        let storeStatus: 'INACTIVE' | 'PENDING' | 'REJECTED' | 'ACTIVE';
        if (kyc.status === 'PENDING') storeStatus = 'PENDING';
        else if (kyc.status === 'APPROVED') storeStatus = 'ACTIVE';
        else if (kyc.status === 'REJECTED') storeStatus = 'REJECTED';
        else storeStatus = 'INACTIVE';

        return {
          status: storeStatus,
          message: this.getStatusMessage(storeStatus),
          canAccessDashboard: storeStatus === 'ACTIVE'
        };
      } catch (e: any) {
        // If KYC not found, status is INACTIVE
        if (e?.status === 404) {
          return {
            status: 'INACTIVE',
            message: 'Bạn chưa hoàn thành thông tin KYC',
            canAccessDashboard: false
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  }

  /**
   * Get status message for display
   */
  private static getStatusMessage(status: string): string {
    switch (status) {
      case 'INACTIVE':
        return 'Bạn chưa hoàn thành thông tin KYC. Vui lòng hoàn tất để bắt đầu bán hàng.';
      case 'PENDING':
        return 'Yêu cầu KYC của bạn đang được xét duyệt. Vui lòng chờ 1-3 ngày làm việc.';
      case 'REJECTED':
        return 'Yêu cầu KYC của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin và gửi lại.';
      case 'ACTIVE':
        return 'Cửa hàng của bạn đã được kích hoạt. Chào mừng bạn đến với AudioShop!';
      default:
        return 'Trạng thái không xác định';
    }
  }

  /**
   * Check if store can access dashboard
   */
  static async canAccessDashboard(): Promise<boolean> {
    try {
      const statusResponse = await this.getStoreStatus();
      return statusResponse.canAccessDashboard;
    } catch (error) {
      console.error('Error checking dashboard access:', error);
      return false;
    }
  }

  /**
   * Get cached store info (without API call)
   */
  static getCachedStoreInfo(): StoreInfo | null {
    try {
      const cachedInfo = localStorage.getItem('seller_store_info');
      if (cachedInfo) {
        return JSON.parse(cachedInfo);
      }
      return null;
    } catch (error) {
      console.error('Error getting cached store info:', error);
      return null;
    }
  }

  /**
   * Clear store cache
   */
  static clearStoreCache(): void {
    localStorage.removeItem('seller_store_id');
    localStorage.removeItem('seller_store_info');
  }

  /**
   * Update store information
   */
  static async updateStoreInfo(updateData: Partial<StoreInfo>): Promise<StoreInfo> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const storeId = await this.getStoreId();

      const response = await fetch(`${API_URL}/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update cache
      localStorage.setItem('seller_store_info', JSON.stringify(data.data));
      
      return data.data;
    } catch (error) {
      console.error('Error updating store info:', error);
      throw error;
    }
  }

  /**
   * Get detailed store profile information
   */
  static async getStoreDetail(storeId: string): Promise<StoreDetail> {
    try {
      console.log('🔍 Getting store detail for ID:', storeId);

      const response = await HttpInterceptor.get<StoreDetailResponse>(`${API_URL}/stores/${storeId}`, {
        userType: 'seller',
      });

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
   * Update store profile information
   */
  static async updateStore(storeId: string, updateData: UpdateStoreRequest): Promise<StoreDetail> {
    try {
      console.log('🔄 Updating store:', { storeId, updateData });

      const response = await HttpInterceptor.put<UpdateStoreResponse>(
        `${API_URL}/stores/${storeId}`,
        updateData,
        { userType: 'seller' }
      );

      console.log('✅ Store updated successfully:', response.data);
      
      if (!response.data) {
        throw new Error('Store update failed');
      }
      
      // Update cache
      localStorage.setItem('seller_store_info', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating store:', error);
      throw error;
    }
  }
}
