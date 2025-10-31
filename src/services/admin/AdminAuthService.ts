import { translateError } from '../../utils/errorTranslation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface AdminUser {
  email: string;
  fullName: string;
  role: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: AdminUser;
  };
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AdminUser;
    accessToken: string;
    refreshToken: string;
  };
}

class AdminAuthServiceClass {
  private readonly ACCESS_TOKEN_KEY = 'admin_access_token';
  private readonly REFRESH_TOKEN_KEY = 'admin_refresh_token';
  private readonly ADMIN_USER_KEY = 'admin_user';

  async login(credentials: AdminLoginRequest): Promise<AdminAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/login/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(credentials)
      });

      const result: AdminLoginResponse = await response.json();

      if (response.ok && result.status === 200) {
        const { accessToken, refreshToken, user } = result.data;

        // Store tokens and user info
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(user));

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
      console.error('Admin login error:', error);
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
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const user = localStorage.getItem(this.ADMIN_USER_KEY);
    return !!(token && user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem(this.ADMIN_USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      // Call refresh token API
      const response = await fetch(`${API_BASE_URL}/api/account/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = result.data;

        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, newRefreshToken);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const AdminAuthService = new AdminAuthServiceClass();