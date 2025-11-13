import React, { useEffect } from 'react';
import StatCard from '../../../components/AdminComponents/StatCard';
import DataTable from '../../../components/AdminComponents/DataTable';
import { showCenterSuccess } from '../../../utils/notification';

const AdminDashboard: React.FC = () => {
  // Check for login success message
  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('adminLoginSuccess');
    if (loginSuccess) {
      try {
        const { message } = JSON.parse(loginSuccess);
        showCenterSuccess(message, 'Thành công');
        sessionStorage.removeItem('adminLoginSuccess');
      } catch (error) {
        console.error('Error parsing admin login success message:', error);
        sessionStorage.removeItem('adminLoginSuccess');
      }
    }
  }, []);

  // Mock data for statistics
  const stats = [
    {
      title: 'Tổng doanh thu',
      value: '₫245,320,000',
      change: '12.5%',
      changeType: 'increase' as const,
      color: 'green' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Đơn hàng mới',
      value: 156,
      change: '8.2%',
      changeType: 'increase' as const,
      color: 'blue' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: 'Khách hàng mới',
      value: 89,
      change: '15.3%',
      changeType: 'increase' as const,
      color: 'purple' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      title: 'Sản phẩm bán chạy',
      value: 234,
      change: '3.1%',
      changeType: 'decrease' as const,
      color: 'orange' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ];

  // Mock data for recent orders
  const recentOrders = [
    {
      id: 'ORD-001',
      customer: 'Nguyễn Văn A',
      product: 'Sony WH-1000XM4',
      amount: '₫8,500,000',
      status: 'Đang xử lý',
      date: '2024-01-10'
    },
    {
      id: 'ORD-002',
      customer: 'Trần Thị B',
      product: 'AirPods Pro',
      amount: '₫6,200,000',
      status: 'Đã giao',
      date: '2024-01-10'
    },
    {
      id: 'ORD-003',
      customer: 'Lê Văn C',
      product: 'Bose QuietComfort 35',
      amount: '₫7,800,000',
      status: 'Đang giao',
      date: '2024-01-09'
    },
    {
      id: 'ORD-004',
      customer: 'Phạm Thị D',
      product: 'Audio-Technica ATH-M50x',
      amount: '₫3,500,000',
      status: 'Đã hủy',
      date: '2024-01-09'
    },
    {
      id: 'ORD-005',
      customer: 'Hoàng Văn E',
      product: 'Sennheiser HD 660S',
      amount: '₫12,000,000',
      status: 'Hoàn thành',
      date: '2024-01-08'
    }
  ];

  // Table columns configuration
  const orderColumns = [
    { key: 'id', label: 'Mã đơn hàng', sortable: true },
    { key: 'customer', label: 'Khách hàng', sortable: true },
    { key: 'product', label: 'Sản phẩm' },
    { key: 'amount', label: 'Số tiền', sortable: true },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (status: string) => {
        const statusColors = {
          'Đang xử lý': 'bg-yellow-100 text-yellow-800',
          'Đã giao': 'bg-green-100 text-green-800',
          'Đang giao': 'bg-blue-100 text-blue-800',
          'Đã hủy': 'bg-red-100 text-red-800',
          'Hoàn thành': 'bg-green-100 text-green-800'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        );
      }
    },
    { key: 'date', label: 'Ngày đặt', sortable: true }
  ];

  // Mock data for top products
  const topProducts = [
    {
      name: 'Sony WH-1000XM4',
      sales: 145,
      revenue: '₫1,232,500,000',
      trend: 'up'
    },
    {
      name: 'AirPods Pro',
      sales: 128,
      revenue: '₫793,600,000',
      trend: 'up'
    },
    {
      name: 'Bose QuietComfort 35',
      sales: 98,
      revenue: '₫764,400,000',
      trend: 'down'
    },
    {
      name: 'Audio-Technica ATH-M50x',
      sales: 87,
      revenue: '₫304,500,000',
      trend: 'up'
    },
    {
      name: 'Sennheiser HD 660S',
      sales: 72,
      revenue: '₫864,000,000',
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Tổng quan hệ thống và các chỉ số quan trọng
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Đơn hàng gần đây</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Xem tất cả
                </button>
              </div>
            </div>
            <div className="p-6">
              <DataTable
                columns={orderColumns}
                data={recentOrders}
                onRowClick={(row) => console.log('Order clicked:', row)}
              />
            </div>
          </div>
        </div>

        {/* Top Products - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.sales} đã bán • {product.revenue}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {product.trend === 'up' ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Thao tác nhanh</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm sản phẩm mới
                </button>
                <button className="w-full inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Quản lý người dùng
                </button>
                <button className="w-full inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Xem báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;