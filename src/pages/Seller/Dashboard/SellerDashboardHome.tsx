/**
 * Seller Dashboard Home Page
 * 
 * Trang tổng quan Dashboard cho người bán hàng
 * - Hiển thị KPI Cards (Doanh thu, Phí, Đơn hàng, Sản phẩm)
 * - Biểu đồ tăng trưởng doanh thu theo tháng/năm
 * - Biểu đồ đơn hàng đã giao
 * - Thống kê return và top sản phẩm bị return
 * - Bảng top sản phẩm bán chạy
 * 
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { DashboardService } from '../../../services/seller/DashboardService';
import type { FullDashboardData } from '../../../types/dashboard';
import { showCenterError } from '../../../utils/notification';

// Import components
import DashboardKPI from '../../../components/Dashboard/DashboardKPI';
import RevenueLineChart from '../../../components/Dashboard/RevenueLineChart';
import OrdersBarChart from '../../../components/Dashboard/OrdersBarChart';
import ReturnBarChart from '../../../components/Dashboard/ReturnBarChart';
import TopSellingTable from '../../../components/Dashboard/TopSellingTable';

const SellerDashboardHome: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterMode, setFilterMode] = useState<'dateRange' | 'year'>('dateRange');

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

  // Load dashboard when dates or year change
  useEffect(() => {
    if (fromDate && toDate) {
      loadDashboard();
    }
  }, [fromDate, toDate, selectedYear]);

  /**
   * Load dashboard data from API
   */
  const loadDashboard = async () => {
    if (!fromDate || !toDate) {
      return;
    }

    // Validate date range
    if (new Date(fromDate) > new Date(toDate)) {
      showCenterError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc', 'Lỗi');
      return;
    }

    setIsLoading(true);
    try {
      // Convert to ISO-8601 format
      const fromDateTime = `${fromDate}T00:00:00`;
      const toDateTime = `${toDate}T23:59:59`;

      // Call API /dashboard/full (single API call)
      const data = await DashboardService.getFullDashboard(
        fromDateTime,
        toDateTime,
        selectedYear
      );

      setDashboardData(data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      showCenterError(
        error?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate year options for select (current year and 4 previous years)
   */
  const getYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  /**
   * Handle year change - auto set date range to full year
   */
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setFilterMode('year');
    
    // Set date range to full year
    setFromDate(`${year}-01-01`);
    setToDate(`${year}-12-31`);
  };

  /**
   * Handle manual date change - switch to dateRange mode
   */
  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setFilterMode('dateRange');
    if (type === 'from') {
      setFromDate(value);
    } else {
      setToDate(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Tổng Quan
          </h1>
          <p className="text-gray-600 mt-1">
            Thống kê doanh thu, đơn hàng và sản phẩm của cửa hàng
          </p>
        </div>
      </div>

      {/* Date Range & Year Filter */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* Filter Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterMode('dateRange')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              filterMode === 'dateRange'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Theo khoảng thời gian
          </button>
          <button
            onClick={() => setFilterMode('year')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              filterMode === 'year'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Theo năm
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {filterMode === 'dateRange' ? (
            <>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn năm
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-orange-50"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={loadDashboard}
            disabled={isLoading || !fromDate || !toDate}
            className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>

        {/* Display current filter info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {filterMode === 'year' ? (
              <>
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-gray-600">
                  Đang lọc toàn bộ dashboard theo{' '}
                  <span className="font-semibold text-orange-600">năm {selectedYear}</span>
                  {' '}(từ 01/01/{selectedYear} đến 31/12/{selectedYear})
                </p>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-gray-600">
                  Đang lọc theo khoảng thời gian:{' '}
                  <span className="font-semibold text-orange-600">
                    {new Date(fromDate).toLocaleDateString('vi-VN')} - {new Date(toDate).toLocaleDateString('vi-VN')}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading && !dashboardData ? (
        // Loading State
        <div className="space-y-6">
          <DashboardKPI summary={{
            grossRevenue: 0,
            platformFeePaid: 0,
            netRevenue: 0,
            deliveredOrderCount: 0,
            itemsSold: 0,
            top10Selling: []
          }} loading={true} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueLineChart growth={null} loading={true} />
            <OrdersBarChart growth={null} loading={true} />
          </div>
        </div>
      ) : dashboardData ? (
        // Data Loaded
        <>
          {/* KPI Cards */}
          <DashboardKPI summary={dashboardData.summary} />

          {/* Revenue Line Chart - Full Width */}
          <RevenueLineChart growth={dashboardData.growth} />

          {/* Orders Bar Chart - Full Width */}
          <OrdersBarChart growth={dashboardData.growth} />

          {/* Top Selling Products Table */}
          <TopSellingTable 
            items={dashboardData.summary.top10Selling}
            dateRange={{ from: fromDate, to: toDate }}
          />

          {/* Returns Bar Chart */}
          <ReturnBarChart returns={dashboardData.returns} />
        </>
      ) : (
        // Empty State
        <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có dữ liệu
            </h3>
            <p className="text-gray-500">
              Chọn khoảng thời gian và nhấn <strong>"Tải lại"</strong> để xem dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardHome;
