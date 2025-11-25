import { HttpInterceptor } from '../HttpInterceptor';

export class WalletService {
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

