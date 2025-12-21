/**
 * Admin Dashboard API Response Types
 * Định nghĩa các types cho API Dashboard của Admin/Platform
 */

// ============================================
// API Response Wrapper
// ============================================
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// ============================================
// API #1: Platform Revenue Overview
// ============================================
export interface PlatformRevenueOverview {
  deliveredItemCount: number;      // Số lượng item đã giao
  totalItemRevenue: number;         // Tổng doanh thu từ items
  platformFeeRevenue: number;       // Doanh thu phí nền tảng
}

export type PlatformRevenueOverviewResponse = ApiResponse<PlatformRevenueOverview>;

// ============================================
// API #2 & #3: Growth Chart Data
// ============================================
export interface GrowthChartPoint {
  year: number;
  month: number;                    // 0 nếu là yearly data
  platformRevenue: number;          // Doanh thu phí nền tảng
  returnRate: number;               // Tỷ lệ hoàn hàng (%)
}

export type GrowthChartResponse = ApiResponse<GrowthChartPoint[]>;

// ============================================
// Combined Dashboard Data
// ============================================
export interface AdminDashboardData {
  overview: PlatformRevenueOverview;
  monthlyGrowth: GrowthChartPoint[];
  yearlyGrowth: GrowthChartPoint[];
}

