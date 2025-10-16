// Seller authentication service
import type {
  SellerRegisterRequest,
  SellerRegisterResponse,
  SellerLoginRequest,
  SellerLoginResponse
} from '../../types/seller';

const API_BASE_URL = 'http://localhost:8080/api';

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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: SellerLoginResponse = await response.json();
      
      // Store authentication data in localStorage
      if (data.data.accessToken) {
        localStorage.setItem('seller_token', data.data.accessToken);
        localStorage.setItem('seller_user', JSON.stringify({
          email: data.data.user.email,
          full_name: data.data.user.fullName,
          role: data.data.user.role
        }));
      }

      return data;
    } catch (error) {
      console.error('Seller login error:', error);
      throw error;
    }
  }

  /**
   * Logout seller
   */
  static logout(): void {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_user');
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
}