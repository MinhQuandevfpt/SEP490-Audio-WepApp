/**
 * Refresh Token Service
 * Handles refresh token logic for all user types (Customer, Seller, Store Staff)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
  };
}

export class RefreshTokenService {
  /**
   * Call refresh token API endpoint
   * POST /api/account/refresh
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      console.log('🔄 Refreshing token...');
      
      const response = await fetch(`${API_BASE_URL}/api/account/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: RefreshTokenResponse = await response.json();
      console.log('✅ Token refreshed successfully');
      
      return data;
    } catch (error) {
      console.error('❌ Refresh token failed:', error);
      throw error;
    }
  }

  /**
   * Check if refresh token exists for a specific user type
   */
  static hasRefreshToken(userType: 'customer' | 'seller' | 'staff'): boolean {
    const key = `${userType}_refresh_token`;
    return !!localStorage.getItem(key);
  }

  /**
   * Get refresh token for a specific user type
   */
  static getRefreshToken(userType: 'customer' | 'seller' | 'staff'): string | null {
    const key = `${userType}_refresh_token`;
    return localStorage.getItem(key);
  }

  /**
   * Store tokens for a specific user type
   */
  static storeTokens(
    userType: 'customer' | 'seller' | 'staff',
    accessToken: string,
    refreshToken: string,
    tokenType: string = 'Bearer'
  ): void {
    const prefix = userType;
    localStorage.setItem(`${prefix}_token`, accessToken);
    localStorage.setItem(`${prefix}_refresh_token`, refreshToken);
    localStorage.setItem(`${prefix}_token_type`, tokenType);
    console.log(`💾 Tokens stored for ${userType}`);
  }

  /**
   * Clear tokens for a specific user type
   */
  static clearTokens(userType: 'customer' | 'seller' | 'staff'): void {
    const prefix = userType;
    localStorage.removeItem(`${prefix}_token`);
    localStorage.removeItem(`${prefix}_refresh_token`);
    localStorage.removeItem(`${prefix}_token_type`);
    console.log(`🗑️ Tokens cleared for ${userType}`);
  }

  /**
   * Refresh token for a specific user type
   */
  static async refreshUserToken(userType: 'customer' | 'seller' | 'staff'): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const currentRefreshToken = this.getRefreshToken(userType);
      
      if (!currentRefreshToken) {
        console.warn(`⚠️ No refresh token found for ${userType}`);
        return null;
      }

      const response = await this.refreshToken(currentRefreshToken);
      
      // Update stored tokens
      this.storeTokens(
        userType,
        response.data.accessToken,
        response.data.refreshToken,
        response.data.tokenType
      );

      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    } catch (error) {
      console.error(`❌ Failed to refresh ${userType} token:`, error);
      // Clear invalid tokens
      this.clearTokens(userType);
      return null;
    }
  }
}

export default RefreshTokenService;
