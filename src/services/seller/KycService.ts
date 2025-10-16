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
      const storeId = await this.getCurrentStoreId();

      const response = await fetch(`${API_URL}/stores/${storeId}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(kycData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: KycResponse = await response.json();
      return data;
    } catch (error) {
      console.error('KYC submission error:', error);
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
   * Get current store ID from authenticated user
   * Use the official API endpoint /api/stores/me/id
   */
  static async getCurrentStoreId(): Promise<string> {
    try {
      // First, try to get store ID from localStorage
      const cachedStoreId = localStorage.getItem('seller_store_id');
      if (cachedStoreId) {
        return cachedStoreId;
      }

      // Get token from localStorage
      const token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      // Use the official API endpoint to get store ID
      const response = await fetch(`${API_URL}/stores/me/id`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const storeData = await response.json();
      
      // According to the API response, the storeId is in the 'data' field
      const storeId = storeData.data;
      
      if (!storeId) {
        throw new Error('Không tìm thấy store ID trong response.');
      }

      // Cache the store ID
      localStorage.setItem('seller_store_id', storeId);
      
      return storeId;
    } catch (error) {
      console.error('Error getting store ID:', error);
      throw error;
    }
  }
}
