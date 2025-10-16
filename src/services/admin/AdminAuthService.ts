import { showSuccess } from '../../utils/notification';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
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

  // Mock admin users for development
  private mockAdmins = [
    {
      id: '1',
      email: 'admin@audiostore.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin' as const,
      avatar: '',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_products', 'manage_system'],
      lastLogin: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  async login(credentials: AdminLoginRequest): Promise<AdminAuthResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const admin = this.mockAdmins.find(
        admin => admin.email === credentials.email && admin.password === credentials.password
      );

      if (!admin) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        };
      }

      // Generate mock tokens
      const accessToken = `admin_token_${admin.id}_${Date.now()}`;
      const refreshToken = `admin_refresh_${admin.id}_${Date.now()}`;

      const adminUser: AdminUser = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
        permissions: admin.permissions,
        lastLogin: new Date().toISOString(),
        createdAt: admin.createdAt
      };

      // Store tokens and user info
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(adminUser));

      showSuccess('Đăng nhập thành công!');

      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: adminUser,
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi trong quá trình đăng nhập'
      };
    }
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_USER_KEY);
    showSuccess('Đăng xuất thành công!');
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

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin' || false;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      // Simulate refresh token API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // For mock, just generate new tokens
      const currentUser = this.getCurrentUser();
      if (!currentUser) return false;

      const newAccessToken = `admin_token_${currentUser.id}_${Date.now()}`;
      const newRefreshToken = `admin_refresh_${currentUser.id}_${Date.now()}`;

      localStorage.setItem(this.ACCESS_TOKEN_KEY, newAccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, newRefreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const AdminAuthService = new AdminAuthServiceClass();