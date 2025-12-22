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

export interface ProductAdviseRequest {
  userId: string;
  productId: string;
}

export interface ProductAdviseResponse {
  product: {
    name: string;
    categories: Array<{
      categoryName: string;
      categoryId: string;
    }>;
    attributes: Array<{
      attributeLabel: string;
      attributeId: string;
      value: string;
      dataType: string;
      attributeName: string;
    }>;
    brandName: string;
    productId: string;
  };
  message: string;
}

export class AIProductSearchService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    return baseUrl.endsWith('/api') ? `${baseUrl}/ai` : `${baseUrl}/api/ai`;
  }

  /**
   * Lấy access token CUSTOMER từ localStorage để debug (cURL)
   */
  private static getCustomerTokenForDebug(): string | null {
    const keys = ['CUSTOMER_token', 'customer_token'];
    for (const key of keys) {
      const token = localStorage.getItem(key);
      if (token) return token;
    }
    return null;
  }

  /**
   * Search products using AI agent
   * POST /api/ai/products/search
   */
  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    const endpoint = `${this.BASE_URL}/products/search`;
    const token = this.getCustomerTokenForDebug();
    
    console.log('========================================');
    console.log('🔍 [API] POST /api/ai/products/search');
    console.log('========================================');
    console.log('📤 REQUEST:');
    console.log('  URL:', endpoint);
    console.log('  Method: POST');
    console.log('  Body:', JSON.stringify(request, null, 2));
    console.log('  Headers:', {
      'Content-Type': 'application/json',
      'userType': 'customer',
    });
    console.log('----------------------------------------');
    console.log('📎 cURL (debug, có kèm token nếu lấy được):');
    console.log(
      [
        "curl -X 'POST' \\",
        `  '${endpoint}' \\`,
        "  -H 'accept: */*' \\",
        "  -H 'Content-Type: application/json' \\",
        token
          ? `  -H 'Authorization: Bearer ${token}' \\`
          : "  -H 'Authorization: Bearer <CUSTOMER_TOKEN>' \\",
        `  -d '${JSON.stringify(request, null, 2)}'`,
        '',
      ].join('\n'),
    );
    console.log('----------------------------------------');
    
    try {
      const response = await HttpInterceptor.post<ProductSearchResponse>(endpoint, request, {
        userType: 'customer',
        credentials: 'include', // ⚠️ QUAN TRỌNG: Gửi cookies với request (BE yêu cầu)
      });
      
      console.log('📥 RESPONSE:');
      console.log('  Status: 200 OK');
      console.log('  Body:', JSON.stringify(response, null, 2));
      console.log('========================================\n');
      
      return response;
    } catch (error: any) {
      console.error('❌ ERROR RESPONSE:');
      console.error('  Status:', error?.status || error?.response?.status || 'Unknown');
      console.error('  Error:', error);
      console.error('  Error Data:', error?.data || error?.response?.data || 'No error data');
      console.log('========================================\n');
      throw error;
    }
  }

  /**
   * Advise AI agent about a product (save product context for future questions)
   * POST /api/ai/products/advise?userId={userId}&productId={productId}
   */
  static async adviseProduct(request: ProductAdviseRequest): Promise<ProductAdviseResponse> {
    const endpoint = `${this.BASE_URL}/products/advise?userId=${encodeURIComponent(request.userId)}&productId=${encodeURIComponent(request.productId)}`;
    const token = this.getCustomerTokenForDebug();
    
    console.log('========================================');
    console.log('📌 [API] POST /api/ai/products/advise');
    console.log('========================================');
    console.log('📤 REQUEST:');
    console.log('  URL:', endpoint);
    console.log('  Method: POST');
    console.log('  Query Params:', JSON.stringify({
      userId: request.userId,
      productId: request.productId,
    }, null, 2));
    console.log('  Body:', '{}', '(empty body)');
    console.log('  Headers:', JSON.stringify({
      'Content-Type': 'application/json',
      'userType': 'customer',
      'accept': '*/*',
    }, null, 2));
    console.log('----------------------------------------');
    console.log('📎 cURL (debug, có kèm token nếu lấy được):');
    console.log(
      [
        "curl -X 'POST' \\",
        `  '${endpoint}' \\`,
        "  -H 'accept: */*' \\",
        token
          ? `  -H 'Authorization: Bearer ${token}' \\`
          : "  -H 'Authorization: Bearer <CUSTOMER_TOKEN>' \\",
        "  -d ''",
        '',
      ].join('\n'),
    );
    console.log('----------------------------------------');
    console.log('⏳ Calling API...');
    
    try {
      const response = await HttpInterceptor.post<ProductAdviseResponse>(endpoint, {}, {
        userType: 'customer',
        credentials: 'include', // ⚠️ QUAN TRỌNG: Gửi cookies với request (BE yêu cầu)
      });
      
      console.log('📥 RESPONSE:');
      console.log('  Status: 200 OK');
      console.log('  Full Response Body:');
      console.log(JSON.stringify(response, null, 2));
      console.log('');
      console.log('  Response Details:');
      console.log('  - Message:', response.message);
      console.log('  - Product ID:', response.product?.productId);
      console.log('  - Product Name:', response.product?.name);
      console.log('  - Brand Name:', response.product?.brandName);
      console.log('  - Categories:', JSON.stringify(response.product?.categories || [], null, 2));
      console.log('  - Attributes:', JSON.stringify(response.product?.attributes || [], null, 2));
      console.log('  - Categories Count:', response.product?.categories?.length || 0);
      console.log('  - Attributes Count:', response.product?.attributes?.length || 0);
      console.log('========================================\n');
      
      return response;
    } catch (error: any) {
      console.error('❌ ERROR RESPONSE:');
      console.error('  Status:', error?.status || error?.response?.status || 'Unknown');
      console.error('  Error:', error);
      console.error('  Error Data:', error?.data || error?.response?.data || 'No error data');
      console.log('========================================\n');
      throw error;
    }
  }
}

export default AIProductSearchService;

