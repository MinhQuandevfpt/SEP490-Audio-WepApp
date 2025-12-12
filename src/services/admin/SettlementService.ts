import { HttpInterceptor } from '../HttpInterceptor';
import type { 
  SettlementReport,
  SettlementReportSummary,
  SettlementReportParams 
} from '../../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

interface SettlementReportResponse {
  status: number;
  message: string;
  data: SettlementReport;
}

interface SettlementReportSummaryResponse {
  status: number;
  message: string;
  data: SettlementReportSummary;
}

export class SettlementService {
  /**
   * Get settlement report summary (only totalAmount)
   * GET /api/v1/settlement/reports/summary
   * @param params Filter parameters
   * @returns Settlement report summary with totalAmount
   */
  static async getSettlementReportSummary(
    params: SettlementReportParams
  ): Promise<SettlementReportSummary> {
    try {
      const { type, date, storeId } = params;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('type', type);
      
      if (date) {
        queryParams.append('date', date);
      }
      
      if (storeId) {
        queryParams.append('storeId', storeId);
      }

      const endpoint = `${API_URL}/v1/settlement/reports/summary?${queryParams.toString()}`;
      
      console.log('📡 Calling settlement report summary API:', endpoint);
      
      const response = await HttpInterceptor.get<SettlementReportSummaryResponse>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Settlement report summary API response:', response);
      
      if (response?.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting settlement report summary:', error);
      throw new Error(error?.message || 'Không thể tải tổng hợp báo cáo settlement');
    }
  }

  /**
   * Get settlement report with full details
   * GET /api/v1/settlement/reports
   * @param params Filter parameters
   * @returns Settlement report with entries and totalAmount
   */
  static async getSettlementReport(
    params: SettlementReportParams
  ): Promise<SettlementReport> {
    try {
      const { type, date, storeId, page, size } = params;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('type', type);
      
      if (date) {
        queryParams.append('date', date);
      }
      
      if (storeId) {
        queryParams.append('storeId', storeId);
      }
      
      if (page !== undefined) {
        queryParams.append('page', page.toString());
      }
      
      if (size !== undefined) {
        queryParams.append('size', size.toString());
      }

      const endpoint = `${API_URL}/v1/settlement/reports?${queryParams.toString()}`;
      
      console.log('📡 Calling settlement report API:', endpoint);
      
      const response = await HttpInterceptor.get<SettlementReportResponse>(
        endpoint,
        {
          userType: 'admin',
          headers: {
            'Accept': '*/*',
          },
        }
      );

      console.log('📥 Settlement report API response:', response);
      
      if (response?.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error getting settlement report:', error);
      throw new Error(error?.message || 'Không thể tải báo cáo settlement');
    }
  }
}

