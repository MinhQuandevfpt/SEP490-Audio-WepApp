/**
 * Admin User-Store KPI Component
 * Hiển thị các chỉ số KPI về Customer và Store với growth metrics
 */

import React from 'react';
import { Users, Store, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { UserStoreOverview } from '../../types/admin-dashboard';

interface AdminUserStoreKPIProps {
  overview: UserStoreOverview;
  loading?: boolean;
  onDateChange?: (year: number, month: number) => void;
}

const AdminUserStoreKPI: React.FC<AdminUserStoreKPIProps> = ({ 
  overview, 
  loading = false
}) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatGrowthPercent = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getGrowthColor = (percent: number): string => {
    if (percent > 0) return 'text-green-600';
    if (percent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (percent: number) => {
    if (percent > 0) return TrendingUp;
    if (percent < 0) return TrendingDown;
    return TrendingUp;
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const kpiCards = [
    {
      id: 'total-customers',
      title: 'Tổng tài khoản khách hàng',
      value: formatNumber(overview.totalCustomerAccounts),
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgIcon: 'bg-white bg-opacity-20',
     
    },
    {
      id: 'new-customers',
      title: `Khách hàng mới (${monthNames[overview.month - 1]}/${overview.year})`,
      value: formatNumber(overview.newCustomersInMonth),
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: `Tháng trước: ${formatNumber(overview.newCustomersPrevMonth)}`,
      growth: overview.customerGrowthPercent,
      highlight: true
    },
    {
      id: 'total-stores',
      title: 'Tổng cửa hàng',
      value: formatNumber(overview.totalStores),
      icon: Store,
      gradient: 'from-purple-500 to-purple-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng số cửa hàng trên nền tảng'
    },
    {
      id: 'new-stores',
      title: `Cửa hàng mới (${monthNames[overview.month - 1]}/${overview.year})`,
      value: formatNumber(overview.newStoresInMonth),
      icon: Store,
      gradient: 'from-pink-500 to-pink-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: `Tháng trước: ${formatNumber(overview.newStoresPrevMonth)}`,
      growth: overview.storeGrowthPercent
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Thống kê Khách hàng & Cửa hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {monthNames[overview.month - 1]} {overview.year}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const GrowthIcon = card.growth !== undefined ? getGrowthIcon(card.growth) : null;
          const growthColor = card.growth !== undefined ? getGrowthColor(card.growth) : '';
          
          return (
            <div
              key={card.id}
              className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                card.highlight ? 'ring-4 ring-indigo-300 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgIcon}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {card.growth !== undefined && GrowthIcon && (
                  <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded-lg">
                    <GrowthIcon className={`w-4 h-4 ${growthColor}`} />
                    <span className={`text-sm font-semibold ${growthColor}`}>
                      {formatGrowthPercent(card.growth)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mb-2 opacity-90">
                {card.title}
              </h3>
              <p className="text-2xl font-bold mb-2">
                {card.value}
              </p>
              <p className="text-xs opacity-75">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUserStoreKPI;

