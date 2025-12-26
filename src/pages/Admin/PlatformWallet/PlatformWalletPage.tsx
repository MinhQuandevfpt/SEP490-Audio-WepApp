import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Clock } from 'lucide-react';
import { PlatformWalletOverviewService } from '../../../services/admin/PlatformWalletOverviewService';
import type { PlatformWalletOverview } from '../../../types/platform-wallet';
import { showCenterError } from '../../../utils/notification';
import PlatformTransactionList from '../../../components/PlatformWalletSection/PlatformTransactionList';

const PlatformWalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<PlatformWalletOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const walletOverview = await PlatformWalletOverviewService.getOverview();
      setWalletData(walletOverview);
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải dữ liệu ví. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ví Hệ Thống</h1>
          <p className="text-gray-600 mt-1">Tổng quan số dư ví nền tảng</p>
        </div>
        <button
          onClick={loadWalletData}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {isLoading && !walletData ? (
        // Loading State
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-pulse">
            <div className="h-48 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : walletData ? (
        // Data Loaded
        <>
          {/* Main Cash Balance Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-2xl shadow-2xl text-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm opacity-90 font-medium">Số dư ví nền tảng</p>
                  <h2 className="text-4xl font-bold mt-1">
                    {formatCurrency(walletData.cashBalance)}
                  </h2>
                </div>
              </div>

            </div>
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white border-opacity-20">
              <Clock className="w-4 h-4 opacity-75" />
              <p className="text-xs opacity-75">
                Cập nhật lần cuối: <span className="font-semibold">{formatDateTime(walletData.lastUpdatedAt)}</span>
              </p>
            </div>
          </div>

          {/* Transaction List Section */}
          <PlatformTransactionList />
        </>
      ) : (
        // Empty State
        <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có dữ liệu
            </h3>
            <p className="text-gray-500">
              Nhấn <strong>"Làm mới"</strong> để tải thông tin ví
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformWalletPage;
