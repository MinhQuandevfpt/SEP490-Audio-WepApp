/**
 * Refresh Token Service
 * Handles refresh token logic for all user types (Customer, Seller, Store Staff)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

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
  static hasRefreshToken(userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN'): boolean {
    const key = userType === 'ADMIN' ? 'admin_refresh_token' : `${userType}_refresh_token`;
    return !!localStorage.getItem(key);
  }

  /**
   * Get refresh token for a specific user type
   */
  static getRefreshToken(userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN'): string | null {
    const key = userType === 'ADMIN' ? 'admin_refresh_token' : `${userType}_refresh_token`;
    return localStorage.getItem(key);
  }

  /**
   * Store tokens for a specific user type
   * OPTIMIZED: Only store UPPERCASE keys + isAuthenticated flag
   * Removed: lowercase duplicates (customer_token, token, token_type)
   */
  static storeTokens(
    userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN',
    accessToken: string,
    refreshToken: string,
    tokenType: string = 'Bearer'
  ): void {
    if (userType === 'ADMIN') {
      localStorage.setItem('admin_access_token', accessToken);
      localStorage.setItem('admin_refresh_token', refreshToken);
      localStorage.setItem('admin_token_type', tokenType);
    } else {
      // Store ONLY uppercase keys (modern format)
      localStorage.setItem(`${userType}_token`, accessToken);
      localStorage.setItem(`${userType}_refresh_token`, refreshToken);
      localStorage.setItem(`${userType}_token_type`, tokenType);
      
      // Only add isAuthenticated flag for CUSTOMER (many components check this)
      if (userType === 'CUSTOMER') {
        localStorage.setItem('isAuthenticated', 'true');
      }
    }
    console.log(`💾 Tokens stored for ${userType} (minimal keys)`);
  }

  /**
   * Store user data for CUSTOMER in MINIMAL format
   * OPTIMIZED: Only store customer_user JSON + camelCase IDs
   * Removed: individual fields (userEmail, userName, userRole), snake_case duplicates
   */
  static storeCustomerData(userData: {
    email: string;
    full_name: string;
    role: string;
    accountId: string;
    customerId: string;
  }): void {
    // Standardized user object (minimal, consistent format)
    const standardUserData = {
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      accountId: userData.accountId,
      customerId: userData.customerId
    };
    
    // Store user object (primary storage - single source of truth)
    localStorage.setItem('customer_user', JSON.stringify(standardUserData));
    
    // Store ONLY camelCase IDs (no snake_case duplicates)
    localStorage.setItem('accountId', userData.accountId);
    localStorage.setItem('customerId', userData.customerId);
    
    console.log('💾 Customer data stored (minimal keys):', {
      email: userData.email,
      name: userData.full_name,
      accountId: userData.accountId,
      customerId: userData.customerId
    });
  }

  /**
   * Clear tokens for a specific user type
   * NOTE: This does NOT clear user info - only auth tokens
   * This is used when token refresh fails but we want to keep user logged in state
   */
      static clearTokens(userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN'): void {
    if (userType === 'ADMIN') {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_token_type');
      // NOTE: Keep admin_user for better UX
    } else {
      localStorage.removeItem(`${userType}_token`);
      localStorage.removeItem(`${userType}_refresh_token`);
      localStorage.removeItem(`${userType}_token_type`);
      // NOTE: Keep user info and store_id for better UX
    }
    console.log(`🗑️ Tokens cleared for ${userType} (user info preserved)`);
  }

  /**
   * Clear all data for a user type (including user info and cache)
   * Use this for logout
   * OPTIMIZED: Clear current minimal keys + old duplicate keys (cleanup)
   */
  static clearAllData(userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN'): void {
    if (userType === 'ADMIN') {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_token_type');
      localStorage.removeItem('admin_user');
    } else if (userType === 'CUSTOMER') {
      // Clear current minimal keys (uppercase)
      localStorage.removeItem('CUSTOMER_token');
      localStorage.removeItem('CUSTOMER_refresh_token');
      localStorage.removeItem('CUSTOMER_token_type');
      localStorage.removeItem('customer_user');
      localStorage.removeItem('accountId');
      localStorage.removeItem('customerId');
      localStorage.removeItem('isAuthenticated');
      
      // Clear old duplicate keys (cleanup from previous versions)
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('customer_token_type');
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('account_id');
      localStorage.removeItem('customer_id');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('refresh_token'); // OAuth old key
      localStorage.removeItem('authStateChanged');
      
      // Clear sessionStorage (welcome messages, etc.)
      sessionStorage.removeItem('welcomeMessage');
    } else if (userType === 'STOREOWNER') {
      // Clear uppercase keys (new format)
      localStorage.removeItem('STOREOWNER_token');
      localStorage.removeItem('STOREOWNER_refresh_token');
      localStorage.removeItem('STOREOWNER_token_type');
      localStorage.removeItem('STOREOWNER_user');
      
      // Clear lowercase keys (backward compatibility)
      localStorage.removeItem('seller_token');
      localStorage.removeItem('seller_refresh_token');
      localStorage.removeItem('seller_token_type');
      localStorage.removeItem('seller_user');
      
      // Clear seller-specific data
      localStorage.removeItem('seller_store_id');
      localStorage.removeItem('seller_store_info');
    } else if (userType === 'STAFF') {
      // Clear uppercase keys (new format)
      localStorage.removeItem('STAFF_token');
      localStorage.removeItem('STAFF_refresh_token');
      localStorage.removeItem('STAFF_token_type');
      localStorage.removeItem('STAFF_user');
      
      // Clear lowercase keys (backward compatibility)
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_refresh_token');
      localStorage.removeItem('staff_token_type');
      localStorage.removeItem('staff_user');
    }
    console.log(`🗑️ All data cleared for ${userType}`);
  }

  /**
   * Refresh token for a specific user type
   */
      static async refreshUserToken(userType: 'CUSTOMER' | 'STOREOWNER' | 'STAFF' | 'ADMIN'): Promise<{ accessToken: string; refreshToken: string } | null> {
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

      // Update backward compatibility tokens
      if (userType === 'STOREOWNER') {
        localStorage.setItem('seller_token', response.data.accessToken);
      } else if (userType === 'CUSTOMER') {
        localStorage.setItem('customer_token', response.data.accessToken);
      } else if (userType === 'STAFF') {
        localStorage.setItem('staff_token', response.data.accessToken);
        localStorage.setItem('staff_refresh_token', response.data.refreshToken);
      } else if (userType === 'ADMIN') {
        localStorage.setItem('admin_access_token', response.data.accessToken);
        localStorage.setItem('admin_refresh_token', response.data.refreshToken);
      }

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
