// Seller authentication service
import { RefreshTokenService } from '../RefreshTokenService';
import { translateError } from '../../utils/errorTranslation';
import type {
  SellerRegisterRequest,
  SellerRegisterResponse,
  SellerLoginRequest,
  SellerLoginResponse
} from '../../types/seller';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_BASE_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

export class SellerAuthService {
  
  /**
   * Register a new seller account
   */
  static async register(userData: SellerRegisterRequest): Promise<SellerRegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/account/register/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const translatedError = translateError(errorData.message || 'Registration failed');
        throw new Error(translatedError);
      }

      const data: SellerRegisterResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Seller registration error:', error);
      throw error;
    }
  }

  /**
   * Login seller
   */
  static async login(credentials: SellerLoginRequest): Promise<SellerLoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/account/login/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const translatedError = translateError(errorData.message || 'Invalid credentials');
        throw new Error(translatedError);
      }

      const data: SellerLoginResponse = await response.json();
      
      // Store authentication data using RefreshTokenService
      if (data.data.accessToken) {
        const refreshToken = data.data.refreshToken || '';
        const tokenType = data.data.tokenType || 'Bearer';
        
        // Store tokens using RefreshTokenService
        RefreshTokenService.storeTokens('STOREOWNER', data.data.accessToken, refreshToken, tokenType);
        
        // Also store in old format for backward compatibility
        localStorage.setItem('seller_token', data.data.accessToken);
        localStorage.setItem('seller_user', JSON.stringify({
          email: data.data.user.email,
          full_name: data.data.user.fullName,
          role: data.data.user.role,
          storeId: data.data.user.storeId
        }));
        
        // Store store ID if available
        if (data.data.user.storeId) {
          localStorage.setItem('seller_store_id', data.data.user.storeId);
        }
      }

      return data;
    } catch (error) {
      console.error('Seller login error:', error);
      throw error;
    }
  }

  /**
   * Logout seller - Clear all tokens and user data
   */
  static logout(): void {
    // Clear ALL data using RefreshTokenService
    RefreshTokenService.clearAllData('STOREOWNER');
    
    console.log('✅ Seller logged out successfully');
  }

  /**
   * Check if seller is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('seller_token');
    const user = localStorage.getItem('seller_user');
    return !!(token && user);
  }

  /**
   * Get current seller user info
   */
  static getCurrentUser(): { email: string; full_name: string; role: string } | null {
    const userStr = localStorage.getItem('seller_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing seller user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem('seller_token');
  }

  /**
   * Get authorization header
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Refresh seller token
   */
  static async refreshToken(): Promise<string> {
    try {
      console.log('🔄 Refreshing seller token...');
      
      const result = await RefreshTokenService.refreshUserToken('STOREOWNER');
      
      if (!result) {
        throw new Error('Failed to refresh token');
      }
      
      // Update seller_token in localStorage for backward compatibility
      localStorage.setItem('seller_token', result.accessToken);
      
      console.log('✅ Seller token refreshed successfully');
      return result.accessToken;
    } catch (error) {
      console.error('❌ Seller token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return RefreshTokenService.getRefreshToken('STOREOWNER');
  }
}