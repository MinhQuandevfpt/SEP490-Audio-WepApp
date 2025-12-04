import { HttpInterceptor } from '../HttpInterceptor';
import type { WalletInfo } from '../../types/api';

export class WalletService {
  /**
   * Get wallet information (overview)
   * GET /api/customers/{customerId}/wallet
   */
  static async getWalletInfo(customerId: string): Promise<WalletInfo> {
    return HttpInterceptor.get<WalletInfo>(`/api/customers/${customerId}/wallet`, {
      userType: 'customer',
    });
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

    return HttpInterceptor.get(`/api/customers/${customerId}/wallet/transactions?${query.toString()}`, {
      userType: 'customer',
    });
  }
}

export default WalletService;

