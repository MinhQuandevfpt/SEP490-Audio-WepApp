import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  PlatformWallet, 
  PlatformWalletResponse,
  PlatformTransaction,
  PlatformTransactionFilterParams 
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
}

