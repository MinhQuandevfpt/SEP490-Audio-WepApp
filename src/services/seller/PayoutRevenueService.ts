// Seller Payout Revenue Service
import type { PayoutBill, PayoutBillListParams } from '../../types/admin';
import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class PayoutRevenueService {
  /**
   * Get payout bills for current store
   * @param params - Filter parameters (status, fromDate, toDate, billCode)
   * @returns Promise<PayoutBill[]>
   */
  static async getPayoutBills(params?: Omit<PayoutBillListParams, 'storeId'>): Promise<PayoutBill[]> {
    try {
      // Get current store ID from localStorage
      let storeId = localStorage.getItem('seller_store_id');
      
      // Fallback: try to get from seller_store_info
      if (!storeId) {
        const storeInfoStr = localStorage.getItem('seller_store_info');
        if (storeInfoStr) {
          try {
            const storeInfo = JSON.parse(storeInfoStr);
            storeId = storeInfo.id;
          } catch (e) {
            console.error('Failed to parse seller_store_info:', e);
          }
        }
      }
      
      if (!storeId) {
        throw new Error('Store ID not found. Please login again.');
      }

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('storeId', storeId);
      
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.fromDate) {
        queryParams.append('fromDate', params.fromDate);
      }
      if (params?.toDate) {
        queryParams.append('toDate', params.toDate);
      }
      if (params?.billCode) {
        queryParams.append('billCode', params.billCode);
      }

      const url = `${API_BASE_URL}/api/admin/payout-bill?${queryParams.toString()}`;
      const response = await HttpInterceptor.get<PayoutBill[]>(url, { userType: 'seller' });
      
      return response || [];
    } catch (error: any) {
      console.error('Error fetching payout bills:', error);
      throw new Error(error?.message || 'Không thể tải danh sách hóa đơn payout');
    }
  }

  /**
   * Get payout bill detail by ID
   * @param billId - Bill ID
   * @returns Promise<PayoutBill>
   */
  static async getPayoutBillDetail(billId: string): Promise<PayoutBill> {
    try {
      const url = `${API_BASE_URL}/api/admin/payout-bill/${billId}`;
      const response = await HttpInterceptor.get<PayoutBill>(url, { userType: 'seller' });
      
      if (!response) {
        throw new Error('Bill not found');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching payout bill detail:', error);
      throw new Error(error?.message || 'Không thể tải chi tiết hóa đơn payout');
    }
  }
}
