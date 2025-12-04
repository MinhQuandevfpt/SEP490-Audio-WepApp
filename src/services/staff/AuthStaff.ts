// Store Staff authentication service
import { RefreshTokenService } from '../RefreshTokenService';
import { translateError } from '../../utils/errorTranslation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';  

export interface StaffLoginRequest {
  email: string;
  password: string;
}

export interface StaffLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string; // includes trailing space sometimes, normalize
    user: {
      email: string;
      fullName: string;
      role: string;
    };
    staff: {
      staffId: string;
      storeId: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
}

export interface StaffUser {
  email: string;
  full_name: string;
  role: string;
  staff_id?: string;
  store_id?: string;
  phone?: string;
}

export class StoreStaffAuthService {
  /**
   * Login store staff
   */
  static async login(credentials: StaffLoginRequest): Promise<StaffLoginResponse> {
    try {
      console.log('🚀 Logging in store staff...');
      
      const response = await fetch(`${API_BASE_URL}/api/account/auth/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const translatedError = translateError(errorData.message || 'Invalid credentials');
        throw new Error(translatedError);
      }

      const data: StaffLoginResponse = await response.json();
      
      // Store authentication data using RefreshTokenService
      if (data.data.accessToken) {
        const refreshToken = data.data.refreshToken || '';
        const tokenType = (data.data.tokenType || 'Bearer').trim();
        
        // Store tokens using RefreshTokenService
        RefreshTokenService.storeTokens('STAFF', data.data.accessToken, refreshToken, tokenType);
        
        // Also store in old format for backward compatibility
        localStorage.setItem('staff_token', data.data.accessToken);
        localStorage.setItem('staff_token_type', tokenType);
        localStorage.setItem('staff_refresh_token', refreshToken);
        localStorage.setItem('staff_user', JSON.stringify({
          email: data.data.user.email,
          full_name: data.data.user.fullName,
          role: data.data.user.role,
          staff_id: data.data.staff?.staffId,
          store_id: data.data.staff?.storeId,
          phone: data.data.staff?.phone,
        }));
      }

      console.log('✅ Store staff login successful');
      return data;
    } catch (error) {
      console.error('❌ Store staff login error:', error);
      throw error;
    }
  }

  /**
   * Logout store staff - Clear all tokens and user data
   */
  static logout(): void {
    // Clear ALL data using RefreshTokenService
    RefreshTokenService.clearAllData('STAFF');
    
    console.log('✅ Store staff logged out successfully');
  }

  /**
   * Check if store staff is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('staff_token');
    const user = localStorage.getItem('staff_user');
    return !!(token && user);
  }

  /**
   * Get current store staff user info
   */
  static getCurrentUser(): StaffUser | null {
    const userStr = localStorage.getItem('staff_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing staff user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem('staff_token');
  }

  /**
   * Get authorization header
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Refresh store staff token
   */
  static async refreshToken(): Promise<string> {
    try {
      console.log('🔄 Refreshing store staff token...');
      
      const result = await RefreshTokenService.refreshUserToken('STAFF');
      
      if (!result) {
        throw new Error('Failed to refresh token');
      }
      
      // Update staff_token in localStorage for backward compatibility
      localStorage.setItem('staff_token', result.accessToken);
      localStorage.setItem('staff_refresh_token', result.refreshToken);
      
      console.log('✅ Store staff token refreshed successfully');
      return result.accessToken;
    } catch (error) {
      console.error('❌ Store staff token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return RefreshTokenService.getRefreshToken('STAFF');
  }
}

export default StoreStaffAuthService;
