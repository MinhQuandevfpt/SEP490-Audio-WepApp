// Admin Product Management Service
import { adminHttpClient } from './AdminStoreService';

export interface ProductFilters {
  categoryName?: string; // accept single or comma-separated for multi-filter UI
  storeId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  status?: string; // accept single or comma-separated statuses
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductResponse {
  productId: string;
  storeId: string;
  storeName: string;
  categoryId: string;
  categoryName: string;
  brandName: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  model: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  variants: ProductVariant[];
  images: string[];
  videoUrl: string | null;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  promotionPercent: number | null;
  priceAfterPromotion: number | null;
  priceBeforeVoucher: number | null;
  voucherAmount: number | null;
  finalPrice: number | null;
  platformFeePercent: number | null;
  currency: string;
  stockQuantity: number;
  warehouseLocation: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  shippingAddress: string | null;
  shippingFee: number | null;
  supportedShippingMethodIds: string[];
  bulkDiscounts: any[];
  status: string;
  isFeatured: boolean;
  ratingAverage: number | null;
  reviewCount: number | null;
  viewCount: number | null;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
  lastUpdateIntervalDays: number;
  createdBy: string;
  updatedBy: string;
  // Additional fields...
  [key: string]: any;
}

export interface ProductVariant {
  variantId: string;
  optionName: string;
  optionValue: string;
  variantPrice: number;
  variantStock: number;
  variantUrl: string | null;
  variantSku: string;
}

export class AdminProductService {
  /**
   * Get all products with filters
   * GET /api/products
   */
  static async getAllProducts(filters?: ProductFilters): Promise<ProductResponse[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.categoryName) params.append('categoryName', filters.categoryName);
      if (filters?.storeId) params.append('storeId', filters.storeId);
      if (filters?.keyword) params.append('keyword', filters.keyword);
      if (filters?.page !== undefined) params.append('page', filters.page.toString());
      if (filters?.size !== undefined) params.append('size', filters.size.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;
      
      const response: any = await adminHttpClient.get<any>(url);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get product detail by ID
   * GET /api/products/{productId}
   */
  static async getProductById(productId: string): Promise<ProductResponse> {
    try {
      const response: any = await adminHttpClient.get<any>(`/api/products/${productId}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching product detail:', error);
      throw error;
    }
  }

  /**
   * Approve or reject a product
   * PUT /api/products/admin/approve/{productId}
   */
  static async approveProduct(productId: string, payload: { approved: boolean; reason?: string }) {
    try {
      console.log('📤 Approving product:', { productId, payload });
      
      const response: any = await adminHttpClient.put<any>(
        `/api/products/admin/approve/${productId}`,
        payload,
        {
          'Content-Type': 'application/json',
        }
      );
      
      console.log('📥 Raw response from API:', response);
      
      // API response structure: { status: number, message: string, data: {...} }
      // Check if response is valid
      if (!response) {
        console.error('❌ No response received');
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      // Check if response indicates an error (even if HTTP status is 200)
      if (response.status && response.status !== 200 && response.status !== 201) {
        console.error('❌ Response has error status:', response.status);
        throw {
          status: response.status,
          message: response.message || 'Lỗi không xác định',
          errors: {}
        };
      }
      
      // If response has data property, return it
      if (response.data !== undefined && response.data !== null) {
        console.log('✅ Success - returning data:', response.data);
        return response.data;
      }
      
      // If response itself is the data (fallback - direct data structure)
      if (response.approved !== undefined || response.productId !== undefined) {
        console.log('✅ Success - returning direct response:', response);
        return response;
      }
      
      // If no valid data found but status is 200, still return response
      if (response.status === 200 || response.status === 201) {
        console.warn('⚠️ Response has status 200 but unexpected structure:', response);
        return response;
      }
      
      // If no valid data found
      console.warn('⚠️ Unexpected response structure:', response);
      return response;
    } catch (error: any) {
      console.error('Error approving product:', error);
      console.error('Error details:', {
        status: error?.status,
        message: error?.message,
        errors: error?.errors,
        fullError: error
      });
      
      // Extract meaningful error message from multiple sources
      let errorMessage = 'Không thể cập nhật duyệt sản phẩm';
      
      // Try to extract message from various error structures
      if (error?.message && error.message !== 'null' && error.message.trim() !== '') {
        errorMessage = error.message;
        
        // Clean up common error prefixes
        errorMessage = errorMessage
          .replace(/^❌\s*approveProduct\s*failed:\s*/i, '')
          .replace(/^❌\s*/g, '')
          .trim();
      } else if (error?.errors && typeof error.errors === 'object') {
        // Try to get first error message from errors object
        const firstError = Object.values(error.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = String(firstError[0]);
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else if (error?.status) {
        // Build error message from status code
        const statusMessages: Record<number, string> = {
          400: 'Yêu cầu không hợp lệ. Chỉ có thể duyệt sản phẩm ở trạng thái DRAFT',
          401: 'Không có quyền truy cập',
          403: 'Bị từ chối truy cập',
          404: 'Không tìm thấy sản phẩm',
          500: 'Lỗi máy chủ. Vui lòng thử lại sau',
          502: 'Lỗi kết nối đến máy chủ',
          503: 'Máy chủ đang bận. Vui lòng thử lại sau',
        };
        errorMessage = statusMessages[error.status] || `Lỗi ${error.status}: Không thể xử lý yêu cầu`;
      } else if (typeof error === 'string' && error.trim() !== '') {
        errorMessage = error;
      }
      
      // Clean up error message
      errorMessage = errorMessage
        .replace(/^❌\s*approveProduct\s*failed:\s*/i, '')
        .replace(/^❌\s*/g, '')
        .trim();
      
      // If still default message and we have status, add status info
      if (errorMessage === 'Không thể cập nhật duyệt sản phẩm' && error?.status) {
        errorMessage = `Lỗi ${error.status}: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
  }
}
