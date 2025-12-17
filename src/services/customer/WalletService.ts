import { HttpInterceptor } from '../HttpInterceptor';
import type { WalletInfo, CreateWithdrawRequestPayload, WithdrawRequest, WithdrawRequestsPage, WithdrawRequestStatus } from '../../types/api';

export class WalletService {
  /**
   * Get wallet information (overview)
   * GET /api/customers/{customerId}/wallet
   */
  static async getWalletInfo(customerId: string): Promise<WalletInfo> {
    const response = await HttpInterceptor.get<any>(`/api/customers/${customerId}/wallet`, {
      userType: 'customer',
    });
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Get wallet transactions (history)
   * GET /api/customers/{customerId}/wallet/transactions
   */
  static async getTransactions(customerId: string, page: number = 0, size: number = 20) {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    const response = await HttpInterceptor.get<any>(`/api/customers/${customerId}/wallet/transactions?${query.toString()}`, {
      userType: 'customer',
    });
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Create deposit checkout (Nạp tiền vào ví)
   * POST /api/v1/payos/wallet/checkout?customerId={customerId}
   */
  static async createDepositCheckout(
    customerId: string,
    payload: {
      amount: number;
      returnUrl: string;
      cancelUrl: string;
    }
  ) {
    return HttpInterceptor.post(
      `/api/v1/payos/wallet/checkout?customerId=${customerId}`,
      payload,
      {
        userType: 'customer',
      }
    );
  }

  /**
   * Create withdraw request (Tạo yêu cầu rút tiền)
   * POST /api/customers/{customerId}/withdraw-requests
   */
  static async createWithdrawRequest(
    customerId: string,
    payload: CreateWithdrawRequestPayload
  ): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.post<any>(
      `/api/customers/${customerId}/withdraw-requests`,
      payload,
      {
        userType: 'customer',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Get withdraw requests (Xem lịch sử yêu cầu rút tiền)
   * GET /api/customers/{customerId}/withdraw-requests
   */
  static async getWithdrawRequests(
    customerId: string,
    params?: {
      status?: WithdrawRequestStatus;
      page?: number;
      size?: number;
    }
  ): Promise<WithdrawRequestsPage> {
    const query = new URLSearchParams();
    
    if (params?.status) query.append('status', params.status);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    
    const response = await HttpInterceptor.get<any>(
      `/api/customers/${customerId}/withdraw-requests${queryString}`,
      {
        userType: 'customer',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }

  /**
   * Get withdraw request detail (Xem chi tiết yêu cầu rút tiền)
   * GET /api/customers/{customerId}/withdraw-requests/{id}
   */
  static async getWithdrawRequestDetail(
    customerId: string,
    withdrawRequestId: string
  ): Promise<WithdrawRequest> {
    const response = await HttpInterceptor.get<any>(
      `/api/customers/${customerId}/withdraw-requests/${withdrawRequestId}`,
      {
        userType: 'customer',
      }
    );
    
    // API returns {status, message, data}, so we need to unwrap data
    return response.data || response;
  }
}

export default WalletService;

