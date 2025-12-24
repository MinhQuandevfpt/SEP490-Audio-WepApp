import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  PlatformWallet, 
  PlatformWalletResponse,
  PlatformTransaction,
  PlatformTransactionFilterParams,
  PlatformTransactionsPageResponse,
  GhnOverview,
  GhnOverviewResponse
} from '../../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class PlatformWalletService {
  /**
   * Get platform wallet information
   * GET /api/platform-wallets/platform
   * @returns Platform wallet with transactions
   */
  static async getPlatformWallet(): Promise<PlatformWallet> {
    try {
      const endpoint = `${API_URL}/platform-wallets/platform`;
      
      console.log('📡 Calling platform wallet API:', endpoint);
      
      const response = await HttpInterceptor.get<PlatformWalletResponse>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Platform wallet API response:', response);
      
      if (response) {
        return response as PlatformWallet;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting platform wallet:', error);
      throw new Error(error?.message || 'Không thể tải thông tin ví hệ thống');
    }
  }

  /**
   * Filter platform wallet transactions
   * GET /api/platform-wallets/transactions/filter
   * @param params Filter parameters
   * @returns List of filtered transactions
   */
  static async filterTransactions(
    params: PlatformTransactionFilterParams = {}
  ): Promise<PlatformTransaction[]> {
    try {
      const {
        storeId,
        customerId,
        status,
        type,
        from,
        to,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (storeId) queryParams.append('storeId', storeId);
      if (customerId) queryParams.append('customerId', customerId);
      if (status) queryParams.append('status', status);
      if (type) queryParams.append('type', type);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);

      const endpoint = `${API_URL}/platform-wallets/transactions/filter?${queryParams.toString()}`;
      
      console.log('📡 Calling platform transactions filter API:', endpoint);
      
      const response = await HttpInterceptor.get<PlatformTransaction[]>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Platform transactions filter API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error filtering platform transactions:', error);
      throw new Error(error?.message || 'Không thể tải danh sách giao dịch');
    }
  }

  /**
   * Get platform wallet transactions with pagination
   * GET /api/platform-wallets/platform/transactions
   * @param params Filter and pagination parameters
   * @returns Paginated list of platform transactions
   */
  static async getPlatformTransactions(
    params: PlatformTransactionFilterParams = {}
  ): Promise<PlatformTransactionsPageResponse['data']> {
    try {
      const {
        status,
        type,
        from,
        to,
        page = 0,
        size = 10,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      if (type) queryParams.append('type', type);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());

      const endpoint = `${API_URL}/platform-wallets/platform/transactions?${queryParams.toString()}`;
      
      console.log('📡 Calling platform transactions API:', endpoint);
      
      const response = await HttpInterceptor.get<PlatformTransactionsPageResponse>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Platform transactions API response:', response);
      
      if (response && response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting platform transactions:', error);
      throw new Error(error?.message || 'Không thể tải danh sách giao dịch');
    }
  }

  /**
   * Get GHN overview (Flat) - nợ GHN, ship khách trả, nợ shop
   * GET /api/platform-wallets/ghn/overview
   * @param params Optional date range filters
   * @returns GHN overview data
   */
  static async getGhnOverview(params?: {
    from?: string;
    to?: string;
  }): Promise<GhnOverview> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const endpoint = `${API_URL}/platform-wallets/ghn/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('📡 Calling GHN overview API:', endpoint);
      
      const response = await HttpInterceptor.get<GhnOverviewResponse>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 GHN overview API response:', response);
      
      if (response && response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting GHN overview:', error);
      throw new Error(error?.message || 'Không thể tải tổng quan GHN');
    }
  }
}

