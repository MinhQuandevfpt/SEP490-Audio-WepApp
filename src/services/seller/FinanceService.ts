import { HttpInterceptor } from '../HttpInterceptor';
import type { WalletTransactionFilterParams, WalletTransactionListResponse, WalletInfoResponse } from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class FinanceService {
  /**
   * Filter wallet transactions with pagination and filters
   * @param params Filter parameters (walletId, from, to, type, transactionId, page, size, sort)
   * @returns Paginated list of transactions
   */
  static async filterTransactions(
    params: WalletTransactionFilterParams = {}
  ): Promise<WalletTransactionListResponse['data']> {
    try {
      const {
        walletId,
        from,
        to,
        type,
        transactionId,
        page = 0,
        size = 10,
        sort = 'createdAt:desc',
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (walletId) queryParams.append('walletId', walletId);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);
      if (type) queryParams.append('type', type);
      if (transactionId) queryParams.append('transactionId', transactionId);
      
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      queryParams.append('sort', sort);

      const endpoint = `${API_URL}/stores/me/wallet/filter?${queryParams.toString()}`;
      
      console.log('📡 Calling wallet filter API:', endpoint);
      
      const response = await HttpInterceptor.get<WalletTransactionListResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Wallet filter API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error filtering wallet transactions:', error);
      throw new Error(error?.message || 'Không thể tải danh sách giao dịch');
    }
  }

  /**
   * Get wallet information for current store
   * @returns Wallet information including balances
   */
  static async getWalletInfo(): Promise<WalletInfoResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet`;
      
      console.log('📡 Calling wallet info API:', endpoint);
      
      const response = await HttpInterceptor.get<WalletInfoResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Wallet info API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting wallet info:', error);
      throw new Error(error?.message || 'Không thể tải thông tin ví');
    }
  }
}

