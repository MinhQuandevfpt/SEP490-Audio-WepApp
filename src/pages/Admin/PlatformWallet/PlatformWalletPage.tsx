import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Clock, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { PlatformWalletOverviewService } from '../../../services/admin/PlatformWalletOverviewService';
import { PlatformWalletService } from '../../../services/admin/PlatformWalletService';
import type { PlatformWalletOverview } from '../../../types/platform-wallet';
import type { GhnOverview } from '../../../types/admin';
import { showCenterError } from '../../../utils/notification';
import PlatformTransactionList from '../../../components/PlatformWalletSection/PlatformTransactionList';

const PlatformWalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<PlatformWalletOverview | null>(null);
  const [ghnOverview, setGhnOverview] = useState<GhnOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletOverview, ghnData] = await Promise.all([
        PlatformWalletOverviewService.getOverview(),
        PlatformWalletService.getGhnOverview()
      ]);
      setWalletData(walletOverview);
      setGhnOverview(ghnData);
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

          {/* GHN Overview Section */}
          {ghnOverview && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Tổng quan GHN</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nợ GHN */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Nợ GHN</span>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(ghnOverview.flatDebtShipToGHN)}
                  </p>
                </div>

                {/* Ship khách trả */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Ship khách trả</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(ghnOverview.customerShipPaid)}
                  </p>
                </div>

                {/* Nợ shop */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Nợ shop</span>
                    <Wallet className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(ghnOverview.storeDebtTotalToFlat)}
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>Đã thanh toán: {formatCurrency(ghnOverview.storeDebtPaidToFlat)}</p>
                    <p>Còn nợ: {formatCurrency(ghnOverview.storeDebtOutstandingToFlat)}</p>
                  </div>
                </div>
              </div>

              
            </div>
          )}

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
