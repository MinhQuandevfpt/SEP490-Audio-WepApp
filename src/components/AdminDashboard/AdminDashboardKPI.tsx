/**
 * Admin Dashboard KPI Component
 * Hiển thị các chỉ số KPI của nền tảng
 */

import React from 'react';
import { DollarSign, Package, TrendingUp, Percent } from 'lucide-react';
import type { PlatformRevenueOverview } from '../../types/admin-dashboard';

interface AdminDashboardKPIProps {
  overview: PlatformRevenueOverview;
  loading?: boolean;
}

const AdminDashboardKPI: React.FC<AdminDashboardKPIProps> = ({ overview, loading = false }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const calculatePlatformFeePercentage = (): number => {
    if (overview.totalItemRevenue === 0) return 0;
    return (overview.platformFeeRevenue / overview.totalItemRevenue) * 100;
  };

  const kpiCards = [
    {
      id: 'delivered-items',
      title: 'Sản phẩm đã giao',
      value: formatNumber(overview.deliveredItemCount),
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng số đơn hàng đã giao thành công'
    },
    {
      id: 'total-revenue',
      title: 'Tổng doanh thu',
      value: formatCurrency(overview.totalItemRevenue),
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng giá trị đơn hàng'
    },
    {
      id: 'platform-fee',
      title: 'Doanh thu nền tảng',
      value: formatCurrency(overview.platformFeeRevenue),
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Phí nền tảng thu được',
      highlight: true
    },
    {
      id: 'fee-percentage',
      title: 'Tỷ lệ phí trung bình',
      value: `${calculatePlatformFeePercentage().toFixed(2)}%`,
      icon: Percent,
      gradient: 'from-orange-500 to-orange-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Phí / Tổng doanh thu'
    }
  ];

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
              card.highlight ? 'ring-4 ring-purple-300 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgIcon}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 opacity-90">
              {card.title}
            </h3>
            <p className="text-2xl font-bold mb-1">
              {card.value}
            </p>
            <p className="text-xs opacity-75">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminDashboardKPI;

