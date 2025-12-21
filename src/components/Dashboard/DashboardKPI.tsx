/**
 * Dashboard KPI Cards Component
 * Hiển thị các chỉ số KPI chính của Dashboard
 */

import React from 'react';
import { DollarSign, Package, TrendingUp, ShoppingBag, TrendingDown } from 'lucide-react';
import type { DashboardSummary } from '../../types/dashboard';

interface DashboardKPIProps {
  summary: DashboardSummary;
  loading?: boolean;
}

const DashboardKPI: React.FC<DashboardKPIProps> = ({ summary, loading = false }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const kpiCards = [
    {
      id: 'gross-revenue',
      title: 'Doanh thu gộp',
      value: formatCurrency(summary.grossRevenue),
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng tiền hàng sau giảm giá'
    },
    {
      id: 'platform-fee',
      title: 'Phí nền tảng',
      value: formatCurrency(summary.platformFeePaid),
      icon: TrendingDown,
      gradient: 'from-purple-500 to-purple-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng phí nền tảng đã trả'
    },
    {
      id: 'net-revenue',
      title: 'Doanh thu ròng',
      value: formatCurrency(summary.netRevenue),
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Doanh thu sau trừ phí',
      highlight: true
    },
    {
      id: 'delivered-orders',
      title: 'Đơn đã giao',
      value: formatNumber(summary.deliveredOrderCount),
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng đơn đã giao thành công'
    },
    {
      id: 'items-sold',
      title: 'Sản phẩm đã bán',
      value: formatNumber(summary.itemsSold),
      icon: ShoppingBag,
      gradient: 'from-indigo-500 to-indigo-600',
      bgIcon: 'bg-white bg-opacity-20',
      description: 'Tổng số lượng sản phẩm'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
              card.highlight ? 'ring-2 ring-orange-300 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${card.bgIcon}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-xs font-medium mb-1 opacity-90">
              {card.title}
            </h3>
            <p className="text-xl font-bold mb-1">
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

export default DashboardKPI;

