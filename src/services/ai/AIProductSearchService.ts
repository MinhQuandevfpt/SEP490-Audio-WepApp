import HttpInterceptor from '../HttpInterceptor';

export interface ProductSearchItem {
  effectivePrice: string;
  productId: string;
  rating: string;
  brand: string;
  name: string;
  summary: string;
}

export interface ProductSearchResult {
  items: ProductSearchItem[];
  warnings: string[];
  productIds: string[];
  message: string;
  count: number;
}

export interface ProductSearchResponse {
  question: string;
  mode: 'product_search' | 'advice' | 'none';
  result?: ProductSearchResult;
  reply?: string;
}

export interface ProductSearchRequest {
  userId: string;
  question: string;
}

export class AIProductSearchService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    return baseUrl.endsWith('/api') ? `${baseUrl}/ai` : `${baseUrl}/api/ai`;
  }

  /**
   * Search products using AI agent
   * POST /api/ai/products/search
   */
  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    const endpoint = `${this.BASE_URL}/products/search`;
    
    return await HttpInterceptor.post<ProductSearchResponse>(endpoint, request, {
      userType: 'customer',
    });
  }
}

export default AIProductSearchService;

