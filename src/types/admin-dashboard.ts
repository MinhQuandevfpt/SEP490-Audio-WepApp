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
// API #4: User-Store Overview Stats
// ============================================
export interface UserStoreOverview {
  totalCustomerAccounts: number;       // Tổng account role CUSTOMER (ALL)
  totalStores: number;                  // Tổng shop (ALL)
  year: number;                         // Năm được filter
  month: number;                        // Tháng được filter
  newCustomersInMonth: number;          // Số customer mới trong tháng
  newStoresInMonth: number;             // Số store mới trong tháng
  newCustomersPrevMonth: number;        // Số customer mới tháng trước
  newStoresPrevMonth: number;           // Số store mới tháng trước
  customerGrowthPercent: number;        // Tăng trưởng % customer so với tháng trước
  storeGrowthPercent: number;           // Tăng trưởng % store so với tháng trước
}

export type UserStoreOverviewResponse = ApiResponse<UserStoreOverview>;

// ============================================
// API #5: User-Store Growth Chart by Year
// ============================================
export interface UserStoreGrowthChartPoint {
  year: number;
  month: number;                        // 1-12
  newCustomers: number;                 // Số customer mới
  newStores: number;                    // Số store mới
}

export type UserStoreGrowthChartResponse = ApiResponse<UserStoreGrowthChartPoint[]>;

// ============================================
// Combined Dashboard Data
// ============================================
export interface AdminDashboardData {
  overview: PlatformRevenueOverview;
  monthlyGrowth: GrowthChartPoint[];
  yearlyGrowth: GrowthChartPoint[];
  userStoreOverview?: UserStoreOverview;
  userStoreGrowthChart?: UserStoreGrowthChartPoint[];
}

