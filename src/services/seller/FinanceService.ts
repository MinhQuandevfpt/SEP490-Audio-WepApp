import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  WalletTransactionFilterParams, 
  WalletTransactionListResponse, 
  WalletInfoResponse,
  WalletTransactionSimpleListResponse,
  PayoutSummaryResponse,
  PayoutItemListResponse,
  PayoutBucket
} from '../../types/seller';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
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

  /**
   * Get wallet transactions list (paginated + filtered by type)
   * GET /api/stores/me/wallet/transactions
   * @param page Page number (default: 0)
   * @param size Page size (default: 10)
   * @param type Transaction type filter (optional)
   * @returns Paginated list of transactions
   */
  static async getTransactions(
    page: number = 0,
    size: number = 10,
    type?: string
  ): Promise<WalletTransactionSimpleListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());
      if (type) {
        queryParams.append('type', type);
      }

      const endpoint = `${API_URL}/stores/me/wallet/transactions?${queryParams.toString()}`;
      
      console.log('📡 Calling wallet transactions API:', endpoint);
      
      const response = await HttpInterceptor.get<WalletTransactionSimpleListResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Wallet transactions API response:', response);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting wallet transactions:', error);
      throw new Error(error?.message || 'Không thể tải danh sách giao dịch');
    }
  }

  /**
   * Get payout summary overview
   * GET /api/stores/me/wallet/payout/summary
   * @returns Payout summary with estimatedGross, pendingGross, doneGross, netProfit
   */
  static async getPayoutSummary(): Promise<PayoutSummaryResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/payout/summary`;
      
      console.log('📡 Calling payout summary API:', endpoint);
      
      const response = await HttpInterceptor.get<PayoutSummaryResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Payout summary API response:', response);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting payout summary:', error);
      throw new Error(error?.message || 'Không thể tải tổng quan payout');
    }
  }

  /**
   * Get payout items by bucket
   * GET /api/stores/me/wallet/payout/items
   * @param bucket Payout bucket: ESTIMATED, PENDING, or DONE
   * @param page Page number (default: 0)
   * @param size Page size (default: 20)
   * @returns Paginated list of payout items
   */
  static async getPayoutItems(
    bucket: PayoutBucket,
    page: number = 0,
    size: number = 20
  ): Promise<PayoutItemListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('bucket', bucket);
      queryParams.append('page', page.toString());
      queryParams.append('size', size.toString());

      const endpoint = `${API_URL}/stores/me/wallet/payout/items?${queryParams.toString()}`;
      
      console.log('📡 Calling payout items API:', endpoint);
      
      const response = await HttpInterceptor.get<PayoutItemListResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Payout items API response:', response);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting payout items:', error);
      throw new Error(error?.message || 'Không thể tải danh sách item payout');
    }
  }
}

