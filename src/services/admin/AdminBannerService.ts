// Admin Banner Management Service
import type { 
  Banner,
  BannerResponse, 
  BannerListResponse,
  CreateBannerRequest,
  UpdateBannerRequest
} from '../../types/admin';
import { showSuccess, showError } from '../../utils/notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class AdminBannerService {
  /**
   * Get all banners
   */
  static async getAllBanners(): Promise<BannerListResponse> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/admin/banners`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: BannerListResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Get all banners error:', error);
      showError('Không thể tải danh sách banner');
      throw error;
    }
  }

  /**
   * Get banner detail by ID
   */
  static async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/admin/banners/${bannerId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: BannerResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get banner detail error:', error);
      showError('Không thể tải chi tiết banner');
      throw error;
    }
  }

  /**
   * Create new banner
   */
  static async createBanner(bannerData: CreateBannerRequest): Promise<Banner> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/admin/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: BannerResponse = await response.json();
      showSuccess(result.message || 'Tạo banner thành công');
      return result.data;
    } catch (error) {
      console.error('Create banner error:', error);
      showError(error instanceof Error ? error.message : 'Không thể tạo banner');
      throw error;
    }
  }

  /**
   * Update banner by ID
   */
  static async updateBanner(bannerId: string, bannerData: UpdateBannerRequest): Promise<Banner> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: BannerResponse = await response.json();
      showSuccess(result.message || 'Cập nhật banner thành công');
      return result.data;
    } catch (error) {
      console.error('Update banner error:', error);
      showError(error instanceof Error ? error.message : 'Không thể cập nhật banner');
      throw error;
    }
  }

  /**
   * Delete banner by ID
   */
  static async deleteBanner(bannerId: string): Promise<void> {
    try {
      const token = localStorage.getItem('admin_access_token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSuccess('Xóa banner thành công');
    } catch (error) {
      console.error('Delete banner error:', error);
      showError(error instanceof Error ? error.message : 'Không thể xóa banner');
      throw error;
    }
  }
}
