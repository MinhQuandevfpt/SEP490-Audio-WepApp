import { translateError } from '../../utils/errorTranslation';
import { RefreshTokenService } from '../RefreshTokenService';
import type { AdminUser } from './AdminAuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

export interface FlatStaffLoginRequest {
  email: string;
  password: string;
}

export interface FlatStaffLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: AdminUser;
    staff: any | null;
  };
}

export interface FlatStaffAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AdminUser;
    accessToken: string;
    refreshToken: string;
  };
}

class FlatStaffAuthServiceClass {
  private readonly ACCESS_TOKEN_KEY = 'flatstaff_access_token';
  private readonly REFRESH_TOKEN_KEY = 'flatstaff_refresh_token';
  private readonly FLATSTAFF_USER_KEY = 'flatstaff_user';

  async login(credentials: FlatStaffLoginRequest): Promise<FlatStaffAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/login/flatstaff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(credentials)
      });

      const result: FlatStaffLoginResponse = await response.json();

      if (response.ok && result.status === 200) {
        const { accessToken, refreshToken, user } = result.data;
        const tokenType = result.data.tokenType || 'Bearer';

        // Store tokens using RefreshTokenService
        // Use 'ADMIN' type because FlatStaff uses the same admin area
        RefreshTokenService.storeTokens('ADMIN', accessToken, refreshToken, tokenType);
        
        // Also store in flatstaff-specific keys for this service
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(this.FLATSTAFF_USER_KEY, JSON.stringify(user));
        
        // Also store in admin_user key so AdminSidebar can read it
        // This allows FlatStaff to use the same AdminLayout
        localStorage.setItem('admin_user', JSON.stringify(user));

        console.log('✅ FlatStaff login successful');

        return {
          success: true,
          message: result.message || 'Đăng nhập thành công',
          data: {
            user,
            accessToken,
            refreshToken
          }
        };
      } else {
        // Translate error message to Vietnamese
        const errorMessage = translateError(result.message || 'Invalid credentials');
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('FlatStaff login error:', error);
      // Translate error message to Vietnamese
      const errorMessage = error instanceof Error 
        ? translateError(error.message) 
        : 'Đã xảy ra lỗi trong quá trình đăng nhập';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  logout(): void {
    // Clear ALL data using RefreshTokenService
    RefreshTokenService.clearAllData('ADMIN');
    
    // Clear flatstaff-specific keys
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.FLATSTAFF_USER_KEY);
    
    // Also clear admin_user if it was set by flatstaff
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        // Only clear if it's a flatstaff user
        if (user.role === 'FLATSTAFF' || user.role === 'flatstaff') {
          localStorage.removeItem('admin_user');
        }
      } catch (e) {
        // If parsing fails, don't clear (might be admin user)
      }
    }
    
    console.log('✅ FlatStaff logged out successfully');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const user = localStorage.getItem(this.FLATSTAFF_USER_KEY);
    return !!(token && user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem(this.FLATSTAFF_USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing flatstaff user data:', error);
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing flatstaff token...');
      
      // Use RefreshTokenService for better handling
      const result = await RefreshTokenService.refreshUserToken('ADMIN');
      
      if (result) {
        // Update flatstaff tokens in localStorage for backward compatibility
        localStorage.setItem(this.ACCESS_TOKEN_KEY, result.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, result.refreshToken);
        
        console.log('✅ FlatStaff token refreshed successfully');
        return true;
      }
      
      console.warn('⚠️ FlatStaff token refresh failed');
      return false;
    } catch (error) {
      console.error('❌ FlatStaff token refresh error:', error);
      return false;
    }
  }
}

export const FlatStaffAuthService = new FlatStaffAuthServiceClass();

