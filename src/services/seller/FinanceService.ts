import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  WalletTransactionFilterParams, 
  WalletTransactionListResponse, 
  WalletInfoResponse,
  WalletTransactionSimpleListResponse,
  PayoutSummary,
  PayoutSummaryResponse,
  PayoutItemsResponse,
  PayoutItemsApiResponse,
  PayoutBucket,
  WalletOverviewResponse
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
   * Get wallet overview for current store
   * GET /api/stores/me/wallet/overview
   * @returns Wallet overview including defaultBalance, depositBalance, debtBalance
   */
  static async getWalletOverview(): Promise<WalletOverviewResponse['data']> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/overview`;
      
      console.log('📡 Calling wallet overview API:', endpoint);
      
      const response = await HttpInterceptor.get<WalletOverviewResponse>(
        endpoint,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Wallet overview API response:', response);
      
      // Handle different response formats
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting wallet overview:', error);
      throw new Error(error?.message || 'Không thể tải tổng quan ví');
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
   * Create topup transaction (Nạp tiền vào defaultBalance)
   * POST /api/stores/{storeId}/wallet/topup
   */
  static async createTopup(
    storeId: string,
    payload: {
      amount: number;
      returnUrl: string;
      cancelUrl: string;
      description?: string;
    }
  ): Promise<{
    transactionId: string;
    amount: number;
    payOSOrderCode: number;
    checkoutUrl: string;
    status: string;
  }> {
    try {
      const endpoint = `${API_URL}/stores/${storeId}/wallet/topup`;
      
      console.log('📡 Creating topup transaction:', endpoint, payload);
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        payload,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Topup API response:', response);
      
      // API might return data directly or wrapped
      return response.data || response;
    } catch (error: any) {
      console.error('❌ Error creating topup:', error);
      throw new Error(error?.message || 'Không thể tạo giao dịch nạp tiền');
    }
  }

  /**
   * Withdraw money from defaultBalance
   * POST /api/stores/me/wallet/withdraw
   */
  static async withdraw(payload: {
    amount: number;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    note?: string;
  }): Promise<{
    storeId: string;
    withdrawAmount: number;
    balanceAfter: number;
    withdrawAt: string;
    transactionId: string;
  }> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/withdraw`;
      
      console.log('📡 Creating withdraw request:', endpoint, payload);
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        payload,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Withdraw API response:', response);
      
      // API might return data directly or wrapped
      return response.data || response;
    } catch (error: any) {
      console.error('❌ Error creating withdraw:', error);
      throw new Error(error?.message || 'Không thể tạo yêu cầu rút tiền');
    }
  }

  /**
   * Transfer money from defaultBalance to depositBalance
   * POST /api/stores/me/wallet/deposit/transfer-in
   */
  static async transferToDeposit(payload: {
    amount: number;
    note?: string;
  }): Promise<{
    storeId: string;
    amount: number;
    defaultBalanceAfter: number;
    depositBalanceAfter: number;
    transactionId: string;
    transferredAt: string;
  }> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/deposit/transfer-in`;
      
      console.log('📡 Transferring to deposit:', endpoint, payload);
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        payload,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Transfer to deposit API response:', response);
      
      // API might return data directly or wrapped
      return response.data || response;
    } catch (error: any) {
      console.error('❌ Error transferring to deposit:', error);
      throw new Error(error?.message || 'Không thể chuyển tiền sang ký quỹ');
    }
  }

  /**
   * Withdraw money from depositBalance to defaultBalance
   * POST /api/stores/me/wallet/deposit/withdraw-to-default
   */
  static async withdrawFromDeposit(payload: {
    amount: number;
  }): Promise<{
    status: number;
    message: string;
    data: any;
  }> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/deposit/withdraw-to-default`;
      
      console.log('📡 Withdrawing from deposit:', endpoint, payload);
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        payload,
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Withdraw from deposit API response:', response);
      
      // API might return data directly or wrapped
      return response.data || response;
    } catch (error: any) {
      console.error('❌ Error withdrawing from deposit:', error);
      throw new Error(error?.message || 'Không thể rút tiền từ ký quỹ');
    }
  }

  /**
   * Pay debt from defaultBalance
   * POST /api/stores/me/wallet/debt/pay
   */
  static async payDebt(): Promise<{
    storeId: string;
    transactionId: string;
    paidAmount: number;
    balanceAfter: number;
    paidOrdersCount: number;
    paidReturnFeesCount: number;
    paidAt: string;
  }> {
    try {
      const endpoint = `${API_URL}/stores/me/wallet/debt/pay`;
      
      console.log('📡 Paying debt:', endpoint);
      
      const response = await HttpInterceptor.post<any>(
        endpoint,
        {},
        {
          userType: 'seller',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Pay debt API response:', response);
      
      // API might return data directly or wrapped
      return response.data || response;
    } catch (error: any) {
      console.error('❌ Error paying debt:', error);
      throw new Error(error?.message || 'Không thể thanh toán nợ');
    }
  }

  /**
   * Get payout summary
   * GET /api/stores/me/payout/summary
   */
  static async getPayoutSummary(params?: {
    from?: string;
    to?: string;
  }): Promise<PayoutSummary> {
    try {
      let endpoint = `${API_URL}/stores/me/payout/summary`;
      
      if (params?.from || params?.to) {
        const queryParams = new URLSearchParams();
        if (params.from) queryParams.append('from', params.from);
        if (params.to) queryParams.append('to', params.to);
        endpoint += `?${queryParams.toString()}`;
      }
      
      console.log('📡 Getting payout summary:', endpoint);
      
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
      throw new Error(error?.message || 'Không thể tải tổng quan chi trả');
    }
  }

  /**
   * Get payout items by bucket (New API)
   * GET /api/stores/me/payout/items
   */
  static async getPayoutItems(params: {
    bucket: PayoutBucket;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PayoutItemsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('bucket', params.bucket);
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      
      const endpoint = `${API_URL}/stores/me/payout/items?${queryParams.toString()}`;
      
      console.log('📡 Getting payout items:', endpoint);
      
      const response = await HttpInterceptor.get<PayoutItemsApiResponse>(
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
      throw new Error(error?.message || 'Không thể tải danh sách chi trả');
    }
  }
}

