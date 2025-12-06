import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  TrendingDown,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { ShopStatsService } from '../../../services/seller/ShopStatsService';
import type { ShopStatsRangeResponse } from '../../../types/seller';
import { showCenterError } from '../../../utils/notification';

const SellerDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<ShopStatsRangeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFromDate(formatDate(thirtyDaysAgo));
    setToDate(formatDate(today));
  }, []);

  // Load stats when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      loadStats();
    }
  }, [fromDate, toDate]);

  const loadStats = async () => {
    if (!fromDate || !toDate) {
      return;
    }

    // Validate date range
    if (new Date(fromDate) > new Date(toDate)) {
      showCenterError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc', 'Lỗi');
      return;
    }

    setIsLoading(true);
    try {
      const data = await ShopStatsService.getShopStatsRangeForCurrentStore(fromDate, toDate);
      setStats(data);
    } catch (error: any) {
      console.error('Error loading shop stats:', error);
      showCenterError(
        error?.message || 'Không thể tải thống kê. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thống kê cửa hàng</h1>
          <p className="text-gray-600 mt-1">Xem thống kê doanh thu và đơn hàng theo khoảng thời gian</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <button
            onClick={loadStats}
            disabled={isLoading || !fromDate || !toDate}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Delivered Orders */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">Đơn hàng đã giao</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {formatNumber(stats.totalDeliveredOrders)}
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">Tổng doanh thu</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>

            {/* Total Platform Fee */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">Phí nền tảng</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {formatCurrency(stats.totalPlatformFee)}
              </p>
            </div>

            {/* Total Net Revenue */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">Doanh thu thực</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {formatCurrency(stats.totalNetRevenue)}
              </p>
            </div>
          </div>

          {/* Return Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Return Requests */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Yêu cầu trả hàng</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-2">
                {formatNumber(stats.totalReturnRequests)}
              </p>
            </div>

            {/* Return Rate */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Tỷ lệ trả hàng</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600 mb-2">
                {stats.returnRate.toFixed(2)}%
              </p>
            </div>

            {/* Top Return Product */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Sản phẩm trả nhiều nhất</h3>
              </div>
              {stats.topReturnProduct ? (
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {stats.topReturnProduct.productName}
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatNumber(stats.topReturnProduct.returnCount)} lần trả
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Không có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Shipping Fees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Shipping Difference Fee */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Phí vận chuyển chênh lệch</h3>
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(stats.totalShippingDifferenceFee)}
              </p>
            </div>

            {/* Total Return Shipping Fee */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Phí vận chuyển trả hàng</h3>
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(stats.totalReturnShippingFee)}
              </p>
            </div>
          </div>

          {/* Top 10 Products */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Top 10 sản phẩm bán chạy</h2>
            </div>
            
            {stats.top10Products && stats.top10Products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">STT</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên sản phẩm</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Số lượng đã bán</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top10Products.map((product, index) => (
                      <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {formatNumber(product.totalSoldQuantity)}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-gray-800 text-right">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Không có dữ liệu sản phẩm</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
          <p className="text-gray-500">Chọn khoảng thời gian để xem thống kê</p>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardHome;
