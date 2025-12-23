import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { Select } from 'antd';
import { AdminDashboardService } from '../../../services/admin/AdminDashboardService';
import type { AdminDashboardData } from '../../../types/admin-dashboard';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

// Import new components
import AdminDashboardKPI from '../../../components/AdminDashboard/AdminDashboardKPI';
import AdminPlatformGrowthChart from '../../../components/AdminDashboard/AdminPlatformGrowthChart';
import AdminUserStoreKPI from '../../../components/AdminDashboard/AdminUserStoreKPI';
import AdminUserStoreGrowthChart from '../../../components/AdminDashboard/AdminUserStoreGrowthChart';

const { Option } = Select;

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states for user-store stats
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  const [userStoreYear, setUserStoreYear] = useState<number | undefined>(currentYear);
  const [userStoreMonth, setUserStoreMonth] = useState<number | undefined>(currentMonth);
  const [chartYear, setChartYear] = useState<number | undefined>(currentYear);

  // Check for login success message
  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('adminLoginSuccess');
    if (loginSuccess) {
      try {
        const { message } = JSON.parse(loginSuccess);
        showCenterSuccess(message, 'Thành công');
        sessionStorage.removeItem('adminLoginSuccess');
      } catch (error) {
        sessionStorage.removeItem('adminLoginSuccess');
      }
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AdminDashboardService.loadFullDashboard(
        userStoreYear,
        userStoreMonth,
        chartYear
      );
      setDashboardData({
        overview: data.overview,
        monthlyGrowth: data.monthlyGrowth,
        yearlyGrowth: data.yearlyGrowth,
        userStoreOverview: data.userStoreOverview,
        userStoreGrowthChart: data.userStoreGrowthChart
      });
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userStoreYear, userStoreMonth, chartYear]);

  // Load dashboard data on mount and when filters change
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Generate year options (current year ± 5 years)
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold leading-7 text-gray-900">
            Dashboard Nền Tảng
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tổng quan doanh thu và các chỉ số quan trọng của nền tảng
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
          <button
            onClick={loadDashboard}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {isLoading && !dashboardData ? (
        // Loading State
        <div className="space-y-6">
          <AdminDashboardKPI
            overview={{
              deliveredItemCount: 0,
              totalItemRevenue: 0,
              platformFeeRevenue: 0
            }}
            loading={true}
          />
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-96 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      ) : dashboardData ? (
        // Data Loaded
        <>
          {/* Revenue KPI Cards */}
          <AdminDashboardKPI overview={dashboardData.overview} />

          {/* Revenue Growth Chart */}
          <AdminPlatformGrowthChart
            monthlyData={dashboardData.monthlyGrowth}
            yearlyData={dashboardData.yearlyGrowth}
          />

          {/* User-Store Stats Section */}
          <div className="space-y-6">
            {/* Filter Section for User-Store Overview */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Bộ lọc thống kê Khách hàng & Cửa hàng
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Năm:
                    </label>
                    <Select
                      value={userStoreYear}
                      onChange={(value) => setUserStoreYear(value || undefined)}
                      placeholder="Chọn năm"
                      style={{ width: 120 }}
                      allowClear
                    >
                      {yearOptions.map((year) => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Tháng:
                    </label>
                    <Select
                      value={userStoreMonth}
                      onChange={(value) => setUserStoreMonth(value || undefined)}
                      placeholder="Chọn tháng"
                      style={{ width: 140 }}
                      allowClear
                    >
                      {monthOptions.map((month) => (
                        <Option key={month.value} value={month.value}>
                          {month.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* User-Store KPI Cards */}
            {dashboardData.userStoreOverview && (
              <AdminUserStoreKPI overview={dashboardData.userStoreOverview} />
            )}
          </div>

          {/* User-Store Growth Chart Section */}
          <div className="space-y-6">
            {/* Filter Section for Chart */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Bộ lọc biểu đồ tăng trưởng
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Năm:
                  </label>
                  <Select
                    value={chartYear}
                    onChange={(value) => setChartYear(value || undefined)}
                    placeholder="Chọn năm"
                    style={{ width: 120 }}
                    allowClear
                  >
                    {yearOptions.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* User-Store Growth Chart */}
            {dashboardData.userStoreGrowthChart && dashboardData.userStoreGrowthChart.length > 0 && (
              <AdminUserStoreGrowthChart data={dashboardData.userStoreGrowthChart} />
            )}
          </div>
        </>
      ) : (
        // Empty State
        <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có dữ liệu
            </h3>
            <p className="text-gray-500">
              Nhấn <strong>"Làm mới"</strong> để tải dữ liệu dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;