/**
 * Admin Dashboard API Service
 * Service để gọi các API Dashboard của Admin/Platform
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type {
  PlatformRevenueOverviewResponse,
  GrowthChartResponse,
  PlatformRevenueOverview,
  GrowthChartPoint
} from '../../types/admin-dashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class AdminDashboardService {
  /**
   * API #1: Lấy tổng quan doanh thu nền tảng
   * GET /api/platform/revenue/overview
   */
  static async getRevenueOverview(): Promise<PlatformRevenueOverview> {
    const response = await HttpInterceptor.get<PlatformRevenueOverviewResponse>(
      `${API_URL}/platform/revenue/overview`,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * API #2: Lấy biểu đồ tăng trưởng theo tháng
   * GET /api/platform/revenue/growth/chart/month
   */
  static async getMonthlyGrowthChart(): Promise<GrowthChartPoint[]> {
    const response = await HttpInterceptor.get<GrowthChartResponse>(
      `${API_URL}/platform/revenue/growth/chart/month`,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * API #3: Lấy biểu đồ tăng trưởng theo năm
   * GET /api/platform/revenue/growth/chart/year
   */
  static async getYearlyGrowthChart(): Promise<GrowthChartPoint[]> {
    const response = await HttpInterceptor.get<GrowthChartResponse>(
      `${API_URL}/platform/revenue/growth/chart/year`,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * Load toàn bộ dashboard data
   */
  static async loadFullDashboard(): Promise<{
    overview: PlatformRevenueOverview;
    monthlyGrowth: GrowthChartPoint[];
    yearlyGrowth: GrowthChartPoint[];
  }> {
    const [overview, monthlyGrowth, yearlyGrowth] = await Promise.all([
      this.getRevenueOverview(),
      this.getMonthlyGrowthChart(),
      this.getYearlyGrowthChart()
    ]);

    return { overview, monthlyGrowth, yearlyGrowth };
  }
}

