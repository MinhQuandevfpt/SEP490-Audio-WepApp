/**
 * Dashboard API Service
 * Service để gọi các API Dashboard của Store
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type {
  DashboardSummaryResponse,
  GrowthResponse,
  ReturnStatsResponse,
  FullDashboardResponse,
  DashboardSummary,
  GrowthData,
  ReturnStats,
  FullDashboardData
} from '../../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class DashboardService {
  /**
   * API #1: Lấy thống kê tổng quan
   * @param from Thời gian bắt đầu (ISO-8601: yyyy-MM-dd'T'HH:mm:ss)
   * @param to Thời gian kết thúc (ISO-8601: yyyy-MM-dd'T'HH:mm:ss)
   */
  static async getSummary(from: string, to: string): Promise<DashboardSummary> {
    const queryParams = new URLSearchParams();
    queryParams.append('from', from);
    queryParams.append('to', to);

    const response = await HttpInterceptor.get<DashboardSummaryResponse>(
      `${API_URL}/store/dashboard/summary?${queryParams.toString()}`,
      { userType: 'seller' }
    );
    return response.data;
  }

  /**
   * API #2: Lấy dữ liệu tăng trưởng theo tháng
   * @param year Năm cần thống kê
   */
  static async getGrowthByMonth(year: number): Promise<GrowthData> {
    const queryParams = new URLSearchParams();
    queryParams.append('year', year.toString());

    const response = await HttpInterceptor.get<GrowthResponse>(
      `${API_URL}/store/dashboard/growth/month?${queryParams.toString()}`,
      { userType: 'seller' }
    );
    return response.data;
  }

  /**
   * API #3: Lấy dữ liệu tăng trưởng theo năm
   * @param fromYear Năm bắt đầu
   * @param toYear Năm kết thúc
   */
  static async getGrowthByYear(fromYear: number, toYear: number): Promise<GrowthData> {
    const queryParams = new URLSearchParams();
    queryParams.append('fromYear', fromYear.toString());
    queryParams.append('toYear', toYear.toString());

    const response = await HttpInterceptor.get<GrowthResponse>(
      `${API_URL}/store/dashboard/growth/year?${queryParams.toString()}`,
      { userType: 'seller' }
    );
    return response.data;
  }

  /**
   * API #4: Lấy thống kê return
   * @param from Thời gian bắt đầu (ISO-8601)
   * @param to Thời gian kết thúc (ISO-8601)
   */
  static async getReturnStats(from: string, to: string): Promise<ReturnStats> {
    const queryParams = new URLSearchParams();
    queryParams.append('from', from);
    queryParams.append('to', to);

    const response = await HttpInterceptor.get<ReturnStatsResponse>(
      `${API_URL}/store/dashboard/returns?${queryParams.toString()}`,
      { userType: 'seller' }
    );
    return response.data;
  }

  /**
   * API #5: Lấy toàn bộ dashboard (1 call duy nhất)
   * @param from Thời gian bắt đầu (ISO-8601)
   * @param to Thời gian kết thúc (ISO-8601)
   * @param year Năm để lấy growth chart (optional)
   */
  static async getFullDashboard(
    from: string,
    to: string,
    year?: number
  ): Promise<FullDashboardData> {
    const queryParams = new URLSearchParams();
    queryParams.append('from', from);
    queryParams.append('to', to);
    if (year !== undefined) {
      queryParams.append('year', year.toString());
    }

    const response = await HttpInterceptor.get<FullDashboardResponse>(
      `${API_URL}/store/dashboard/full?${queryParams.toString()}`,
      { userType: 'seller' }
    );
    return response.data;
  }
}

