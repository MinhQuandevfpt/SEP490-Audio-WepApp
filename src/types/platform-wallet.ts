/**
 * Platform Wallet Types
 * Types cho API Ví Nền Tảng
 */

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PlatformWalletOverview {
  totalCustomerDeposit: number;
  pendingBalance: number;
  doneBalance: number;
  refundedTotal: number;
  commissionBalance: number;
  cashBalance: number;              // ← Số dư tiền mặt chính
  totalBalance: number;
  pendingOrderCount: number;
  doneOrderCount: number;
  lastUpdatedAt: string;
  summary: string;
}

export type PlatformWalletOverviewResponse = ApiResponse<PlatformWalletOverview>;

