/**
 * Admin Dashboard API Service
 * Service để gọi các API Dashboard của Admin/Platform
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type {
  PlatformRevenueOverviewResponse,
  GrowthChartResponse,
  PlatformRevenueOverview,
  GrowthChartPoint,
  UserStoreOverviewResponse,
  UserStoreOverview,
  UserStoreGrowthChartResponse,
  UserStoreGrowthChartPoint
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
   * API #4: Lấy tổng quan customer/store + growth theo tháng
   * GET /api/platform/stats/user-store/overview
   * @param year - Optional: Năm (nếu không truyền => tháng hiện tại)
   * @param month - Optional: Tháng (nếu không truyền => tháng hiện tại)
   */
  static async getUserStoreOverview(
    year?: number,
    month?: number
  ): Promise<UserStoreOverview> {
    const queryParams = new URLSearchParams();
    if (year !== undefined) {
      queryParams.append('year', year.toString());
    }
    if (month !== undefined) {
      queryParams.append('month', month.toString());
    }

    const url = `${API_URL}/platform/stats/user-store/overview${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await HttpInterceptor.get<UserStoreOverviewResponse>(
      url,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * API #5: Lấy biểu đồ tăng trưởng customer/store theo năm (12 tháng)
   * GET /api/platform/stats/user-store/growth/chart/year
   * @param year - Optional: Năm (nếu không truyền => năm hiện tại)
   */
  static async getUserStoreGrowthChart(
    year?: number
  ): Promise<UserStoreGrowthChartPoint[]> {
    const queryParams = new URLSearchParams();
    if (year !== undefined) {
      queryParams.append('year', year.toString());
    }

    const url = `${API_URL}/platform/stats/user-store/growth/chart/year${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await HttpInterceptor.get<UserStoreGrowthChartResponse>(
      url,
      { userType: 'admin' }
    );
    return response.data;
  }

  /**
   * Load toàn bộ dashboard data
   * @param userStoreYear - Optional: Năm filter cho user-store overview
   * @param userStoreMonth - Optional: Tháng filter cho user-store overview
   * @param chartYear - Optional: Năm filter cho growth chart
   */
  static async loadFullDashboard(
    userStoreYear?: number,
    userStoreMonth?: number,
    chartYear?: number
  ): Promise<{
    overview: PlatformRevenueOverview;
    monthlyGrowth: GrowthChartPoint[];
    yearlyGrowth: GrowthChartPoint[];
    userStoreOverview?: UserStoreOverview;
    userStoreGrowthChart?: UserStoreGrowthChartPoint[];
  }> {
    const [overview, monthlyGrowth, yearlyGrowth, userStoreOverview, userStoreGrowthChart] = 
      await Promise.all([
      this.getRevenueOverview(),
      this.getMonthlyGrowthChart(),
      this.getYearlyGrowthChart(),
      this.getUserStoreOverview(userStoreYear, userStoreMonth).catch(() => undefined),
      this.getUserStoreGrowthChart(chartYear).catch(() => undefined)
    ]);

    return { 
      overview, 
      monthlyGrowth, 
      yearlyGrowth,
      userStoreOverview,
      userStoreGrowthChart
    };
  }
}

