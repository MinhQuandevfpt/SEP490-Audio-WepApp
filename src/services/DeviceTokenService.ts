/**
 * Device Token Service
 * Handles API calls to register/update FCM tokens with backend
 */

import { HttpInterceptor } from './HttpInterceptor';

export type UserType = 'CUSTOMER' | 'STOREOWNER';

export interface RegisterTokenRequest {
  token: string;
}

export interface RegisterTokenResponse {
  success: boolean;
  message?: string;
}

class DeviceTokenServiceClass {
  /**
   * Register or update FCM token for customer
   * POST /api/customers/me/devices
   */
  async registerCustomerToken(token: string): Promise<RegisterTokenResponse> {
    try {
      const response = await HttpInterceptor.fetch<RegisterTokenResponse>(
        '/api/customers/me/devices',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token } as RegisterTokenRequest),
          userType: 'customer',
        }
      );

      return response;
    } catch (error: any) {
      console.error('Error registering customer token:', error);
      throw new Error(error?.message || 'Failed to register customer token');
    }
  }

  /**
   * Register or update FCM token for store owner
   * POST /api/store/me/devices
   */
  async registerStoreToken(token: string): Promise<RegisterTokenResponse> {
    try {
      const response = await HttpInterceptor.fetch<RegisterTokenResponse>(
        '/api/store/me/devices',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token } as RegisterTokenRequest),
          userType: 'seller',
        }
      );

      return response;
    } catch (error: any) {
      console.error('Error registering store token:', error);
      throw new Error(error?.message || 'Failed to register store token');
    }
  }

  /**
   * Register token based on user type
   */
  async registerToken(token: string, userType: UserType): Promise<RegisterTokenResponse> {
    if (userType === 'CUSTOMER') {
      return this.registerCustomerToken(token);
    } else if (userType === 'STOREOWNER') {
      return this.registerStoreToken(token);
    } else {
      throw new Error(`Unsupported user type: ${userType}`);
    }
  }
}

export const DeviceTokenService = new DeviceTokenServiceClass();

