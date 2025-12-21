import React, { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { AdminDashboardService } from '../../../services/admin/AdminDashboardService';
import type { AdminDashboardData } from '../../../types/admin-dashboard';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

// Import new components
import AdminDashboardKPI from '../../../components/AdminDashboard/AdminDashboardKPI';
import AdminPlatformGrowthChart from '../../../components/AdminDashboard/AdminPlatformGrowthChart';

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await AdminDashboardService.loadFullDashboard();
      setDashboardData({
        overview: data.overview,
        monthlyGrowth: data.monthlyGrowth,
        yearlyGrowth: data.yearlyGrowth
      });
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
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
          {/* KPI Cards */}
          <AdminDashboardKPI overview={dashboardData.overview} />

          {/* Growth Chart */}
          <AdminPlatformGrowthChart
            monthlyData={dashboardData.monthlyGrowth}
            yearlyData={dashboardData.yearlyGrowth}
          />
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