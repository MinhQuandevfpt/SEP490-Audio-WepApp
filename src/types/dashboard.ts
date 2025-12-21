/**
 * Dashboard API Response Types
 * Định nghĩa các types cho API Dashboard của Store
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
// API #1: Summary Response
// ============================================
export interface TopSellingItem {
  refId: string;
  quantitySold: number;
}

export interface DashboardSummary {
  grossRevenue: number;           // Tổng doanh thu gộp
  platformFeePaid: number;         // Tổng phí nền tảng
  netRevenue: number;              // Doanh thu ròng
  deliveredOrderCount: number;     // Số đơn đã giao
  itemsSold: number;               // Số sản phẩm đã bán
  top10Selling: TopSellingItem[];  // Top 10 sản phẩm bán chạy
}

export type DashboardSummaryResponse = ApiResponse<DashboardSummary>;

// ============================================
// API #2 & #3: Growth Response
// ============================================
export interface GrowthPoint {
  year: number;
  month: number | null;           // null nếu granularity = 'YEAR'
  grossRevenue: number;
  platformFeePaid: number;
  netRevenue: number;
  deliveredOrderCount: number;
  itemsSold: number;
}

export interface GrowthData {
  year: number;
  granularity: 'MONTH' | 'YEAR';
  points: GrowthPoint[];
}

export type GrowthResponse = ApiResponse<GrowthData>;

// ============================================
// API #4: Returns Response
// ============================================
export interface ReturnedProduct {
  productId: string;
  count: number;
}

export interface ReturnStats {
  returnCount: number;                      // Tổng số return
  top5ReturnedProducts: ReturnedProduct[];  // Top 5 sản phẩm bị return
}

export type ReturnStatsResponse = ApiResponse<ReturnStats>;

// ============================================
// API #5: Full Dashboard Response
// ============================================
export interface FullDashboardData {
  summary: DashboardSummary;
  returns: ReturnStats;
  growth: GrowthData | null;  // null nếu không truyền year
}

export type FullDashboardResponse = ApiResponse<FullDashboardData>;

