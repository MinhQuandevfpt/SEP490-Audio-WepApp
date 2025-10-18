// KYC Service for Seller Onboarding
import type { KycRequest, KycResponse } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class KycService {
  /**
   * Submit KYC request for store verification
   */
  static async submitKyc(kycData: KycRequest): Promise<KycResponse> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Get store ID
      console.log('🔍 Getting store ID for KYC submission...');
      const storeId = await this.getCurrentStoreId();
      console.log('✅ Store ID received:', storeId);

      console.log('📤 Submitting KYC to:', `${API_URL}/stores/${storeId}/kyc`);
      console.log('📋 KYC Data:', kycData);

      const response = await fetch(`${API_URL}/stores/${storeId}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(kycData),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ KYC Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: KycResponse = await response.json();
      console.log('✅ KYC submitted successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ KYC submission error:', error);
      throw error;
    }
  }

  /**
   * Upload file to server and return URL
   * Note: This is a placeholder implementation. You'll need to implement actual file upload
   */
  static async uploadFile(file: File): Promise<string> {
    // TODO: Implement actual file upload logic
    // For now, return a placeholder URL
    return new Promise((resolve) => {
      // Simulate upload delay
      setTimeout(() => {
        // In real implementation, this would be the actual uploaded file URL
        const mockUrl = `https://cdn.example.com/${file.name}`;
        resolve(mockUrl);
      }, 1000);
    });
  }

  /**
   * Get current KYC status
   */
  static async getKycStatus(): Promise<KycResponse | null> {
    try {
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const storeId = await this.getCurrentStoreId();
      console.log('🔍 Getting KYC status for store:', storeId);

      const response = await fetch(`${API_URL}/stores/${storeId}/kyc`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 KYC status response:', response.status);

      if (response.status === 404) {
        console.log('ℹ️ No KYC found (INACTIVE)');
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ KYC status error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ KYC status received:', data);
      
      // Backend returns array or single object
      const kycData = data.data || data;
      
      // If array, get first item
      if (Array.isArray(kycData)) {
        return kycData[0] || null;
      }
      
      return kycData;
    } catch (error) {
      console.error('❌ Error getting KYC status:', error);
      return null;
    }
  }

  /**
   * Get current store ID from authenticated user
   * Use the official API endpoint /api/stores/me/id
   */
  static async getCurrentStoreId(): Promise<string> {
    try {
      // First, try to get store ID from localStorage
      const cachedStoreId = localStorage.getItem('seller_store_id');
      if (cachedStoreId) {
        console.log('✅ Using cached store ID:', cachedStoreId);
        return cachedStoreId;
      }

      // Get token from localStorage
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      console.log('🔍 Fetching store ID from API:', `${API_URL}/stores/me/id`);

      // Use the official API endpoint to get store ID
      const response = await fetch(`${API_URL}/stores/me/id`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Store ID API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Store ID Error Response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const storeData = await response.json();
      console.log('📦 Store data received:', storeData);
      
      // According to the API response, the storeId is in the 'data' field
      const storeId = storeData.data;
      
      if (!storeId) {
        console.error('❌ No store ID found in response:', storeData);
        throw new Error('Không tìm thấy store ID trong response.');
      }

      // Cache the store ID
      localStorage.setItem('seller_store_id', storeId);
      console.log('✅ Store ID cached:', storeId);
      
      return storeId;
    } catch (error) {
      console.error('❌ Error getting store ID:', error);
      throw error;
    }
  }
}
