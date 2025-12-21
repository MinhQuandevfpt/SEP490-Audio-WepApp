/**
 * Platform Wallet Overview Service
 * Service để lấy tổng quan ví nền tảng
 */

import { HttpInterceptor } from '../HttpInterceptor';
import type { PlatformWalletOverviewResponse, PlatformWalletOverview } from '../../types/platform-wallet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class PlatformWalletOverviewService {
  /**
   * Lấy tổng quan ví Platform
   * GET /api/platform-wallets/platform/overview
   */
  static async getOverview(): Promise<PlatformWalletOverview> {
    const response = await HttpInterceptor.get<PlatformWalletOverviewResponse>(
      `${API_URL}/platform-wallets/platform/overview`,
      { userType: 'admin' }
    );
    return response.data;
  }
}

