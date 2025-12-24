// Product Service for Seller Dashboard
import type { Product, ProductListResponse, ProductQueryParams, ProductUpdateRequest } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class ProductService {
 
  static async getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.categoryName) {
        queryParams.append('categoryName', params.categoryName);
      }
      
      if (params.storeId) {
        queryParams.append('storeId', params.storeId);
      }
      
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      
      if (params.status) {
        queryParams.append('status', params.status);
      }
      
      if (params.minPrice !== undefined && params.minPrice !== null) {
        queryParams.append('minPrice', String(params.minPrice));
      }
      
      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        queryParams.append('maxPrice', String(params.maxPrice));
      }
      
      // Pagination
      queryParams.append('page', String(params.page || 0));
      queryParams.append('size', String(params.size || 20));

      const url = `${API_URL}/products?${queryParams.toString()}`;
      console.log('🔍 Fetching products from:', url);
      console.log('📋 Query params:', {
        categoryName: params.categoryName,
        storeId: params.storeId,
        keyword: params.keyword,
        status: params.status,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        page: params.page || 0,
        size: params.size || 20,
      });

      const response = await HttpInterceptor.fetch<Response>(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        userType: 'seller',
      } as any);

      
      console.log('📥 Products request sent via HttpInterceptor');

      const data = response as unknown as any; 
      
     
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      
      console.log('✅ Products API Response:', {
        status: data.status,
        message: data.message,
        hasData: !!data.data,
        isDataArray: Array.isArray(data.data),
        hasContent: !!data.data?.content,
        dataLength: Array.isArray(data.data) ? data.data.length : (data.data?.content?.length || 0),
        totalElements: data.data?.totalElements,
        rawStructure: {
          hasData: !!data.data,
          isArray: Array.isArray(data.data),
          hasContent: !!data.data?.content,
          hasTotalElements: !!data.data?.totalElements,
          dataType: Array.isArray(data.data) ? 'array' : (data.data?.content ? 'pagination' : 'unknown')
        }
      });
      
      
      if (data.data) {
        if (data.data.content && Array.isArray(data.data.content)) {
          
          console.log('📄 Using pagination structure (Spring Boot Page)');
          
        } else if (Array.isArray(data.data)) {
         
          console.log('📄 Converting array structure to pagination format');
          const productsArray = data.data;
          const currentPage = params.page || 0;
          const pageSize = params.size || 20;
          
          data.data = {
            content: productsArray,
            totalElements: productsArray.length,
            totalPages: Math.ceil(productsArray.length / pageSize),
            first: currentPage === 0,
            last: productsArray.length < pageSize,
            size: pageSize,
            number: currentPage,
            numberOfElements: productsArray.length,
            empty: productsArray.length === 0,
            pageable: {
              pageNumber: currentPage,
              pageSize: pageSize,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: currentPage * pageSize,
              paged: true,
              unpaged: false
            },
            sort: {
              empty: true,
              sorted: false,
              unsorted: true
            }
          };
        } else {
          console.warn('⚠️ API returned unexpected data structure, setting empty content');
          data.data = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            size: params.size || 20,
            number: params.page || 0,
            numberOfElements: 0,
            empty: true,
            pageable: {
              pageNumber: params.page || 0,
              pageSize: params.size || 20,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: (params.page || 0) * (params.size || 20),
              paged: true,
              unpaged: false
            },
            sort: {
              empty: true,
              sorted: false,
              unsorted: true
            }
          };
        }
      } else {
       
        console.warn('⚠️ API response has no data field');
        data.data = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          size: params.size || 20,
          number: params.page || 0,
          numberOfElements: 0,
          empty: true,
          pageable: {
            pageNumber: params.page || 0,
            pageSize: params.size || 20,
            sort: { empty: true, sorted: false, unsorted: true },
            offset: (params.page || 0) * (params.size || 20),
            paged: true,
            unpaged: false
          },
          sort: {
            empty: true,
            sorted: false,
            unsorted: true
          }
        };
      }
      
      console.log('📊 Final parsed response:', {
        totalElements: data.data.totalElements,
        contentLength: data.data.content?.length || 0,
        totalPages: data.data.totalPages,
        currentPage: data.data.number
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }

  static async getMyProducts(params: Omit<ProductQueryParams, 'storeId'> = {}): Promise<ProductListResponse> {
    try {
      
      let storeId = localStorage.getItem('seller_store_id');

      if (!storeId) {
        try {
          const { StoreService } = await import('./StoreService');
          storeId = await StoreService.getStoreId();
        } catch (e) {
          console.warn('⚠️ Could not resolve store ID for getMyProducts:', e);
          throw new Error('Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.');
        }
      }

      return this.getProducts({
        ...params,
        storeId,
      });
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
      throw error;
    }
  }


  static async createProduct(payload: Record<string, any>, status: 'DRAFT' | 'ACTIVE' = 'ACTIVE'): Promise<any> {
    try {
     
      let storeId = localStorage.getItem('seller_store_id');
      
      if (!storeId) {
        try {
         
          const { StoreService } = await import('./StoreService');
          storeId = await StoreService.getStoreId();
        } catch (error) {
          console.warn('Could not get store ID:', error);
        }
      }

      
      const payloadWithStatus = {
        ...payload,
        status: status,
        ...(storeId && { storeId: storeId })
      };

      console.log('📤 Creating product with status:', status, 'store ID:', storeId);
      console.log('📤 Full payload:', JSON.stringify(payloadWithStatus, null, 2));

      const data = await HttpInterceptor.post<any>(`${API_URL}/products`, payloadWithStatus, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        userType: 'seller',
      });
      
      console.log('📥 Product creation response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  }


  static async createDraftProduct(payload: Record<string, any>): Promise<any> {
    console.log('📤 createDraftProduct called with payload:', JSON.stringify(payload, null, 2));
    
    
    const draftPayload = {
      ...payload,
      status: 'DRAFT'
    };
    
    console.log('📤 createDraftProduct final payload:', JSON.stringify(draftPayload, null, 2));
    
    const result = await this.createProduct(draftPayload, 'DRAFT');
    
    console.log('📥 createDraftProduct result:', JSON.stringify(result, null, 2));
    
    return result;
  }


  static async createActiveProduct(payload: Record<string, any>): Promise<any> {
    console.log('📤 createActiveProduct called with payload:', JSON.stringify(payload, null, 2));
    
    
    const activePayload = {
      ...payload,
      status: 'ACTIVE'
    };
    
    console.log('📤 createActiveProduct final payload:', JSON.stringify(activePayload, null, 2));
    
    const result = await this.createProduct(activePayload, 'ACTIVE');
    
    console.log('📥 createActiveProduct result:', JSON.stringify(result, null, 2));
    
    return result;
  }

 
  static async getProductById(productId: string): Promise<Product> {
    try {
      console.log('🔍 Fetching product detail:', productId);
      console.log('📡 API URL:', `${API_URL}/products/${productId}`);
      
      const data = await HttpInterceptor.get<{
        status: number;
        message: string;
        data: Product;
      }>(`${API_URL}/products/${productId}`, {
        userType: 'seller',
      });

      console.log('✅ Product detail response:', {
        status: data.status,
        message: data.message,
        productId: data.data?.productId,
        name: data.data?.name,
        categories: (data.data as any)?.categories,
        attributeValues: (data.data as any)?.attributeValues,
        variants: data.data?.variants,
      });

      return data.data || data;
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      throw error;
    }
  }


  static async updateProduct(productId: string, payload: ProductUpdateRequest): Promise<any> {
    try {
      if (!productId) {
        throw new Error('Thiếu mã sản phẩm để cập nhật');
      }

      console.log('✏️ Updating product:', productId);
      console.log('📤 Update payload:', JSON.stringify(payload, null, 2));

      const data = await HttpInterceptor.put<any>(`${API_URL}/products/${productId}`, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        userType: 'seller',
      });

      console.log('✅ Product update response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Error updating product:', error);
      throw error;
    }
  }

  static async toggleProductStatus(productId: string): Promise<any> {
    try {
      const url = `${API_URL}/products/${productId}`;
      console.log('🔄 Toggling product status:', productId);

      const response = await HttpInterceptor.fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        userType: 'seller',
      } as any);

      console.log('✅ Product status toggled:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error toggling product status:', error);
      
      if (error?.message && (
        error.message.includes('PENDING') || 
        error.message.includes('PENDING_APPROVAL') ||
        error.message.includes('Trạng thái hiện tại của sản phẩm: PENDING') ||
        error.message.includes('Trạng thái hiện tại của sản phẩm: PENDING_APPROVAL') ||
        (error.message.includes('API này CHỈ cho phép') && 
         (error.message.includes('PENDING') || error.message.includes('chờ duyệt')))
      )) {
        throw new Error('Sản phẩm đang chờ duyệt, không thể thao tác.');
      }
      
      if (error?.message && (
        error.message.includes('SUSPENDED') || 
        error.message.includes('Trạng thái hiện tại của sản phẩm: SUSPENDED') ||
        (error.message.includes('API này CHỈ cho phép') && 
         !error.message.includes('PENDING') && !error.message.includes('chờ duyệt'))
      )) {
        throw new Error('Sản phẩm đang bị cấm, không thể thao tác.');
      }
      
      throw error;
    }
  }


  static formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

 
  static formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  }

  
  static getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Bản nháp',
      'ACTIVE': 'Đang bán',
      'INACTIVE': 'Ngưng bán',
      'INACTIVE_PAUSE': 'Tạm dừng',
      'OUT_OF_STOCK': 'Hết hàng',
      'PENDING': 'Chờ duyệt',
      'PENDING_APPROVAL': 'Chờ duyệt',
      'REJECTED': 'Bị từ chối',
      'REJECT': 'Bị từ chối',
      'SUSPENDED': 'Vi Phạm',
      'SUSPENDED_DEBT': 'Tạm khóa do nợ',
      'BANNED': 'Vi phạm'
    };
    return statusMap[status] || status;
  }

  
  static getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'INACTIVE_PAUSE': 'bg-orange-100 text-orange-800',
      'OUT_OF_STOCK': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'REJECT': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-red-100 text-red-800',
      'SUSPENDED_DEBT': 'bg-red-100 text-red-800',
      'BANNED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
}
