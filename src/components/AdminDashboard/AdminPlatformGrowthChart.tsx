/**
 * Admin Platform Growth Chart Component
 * Biểu đồ tăng trưởng nền tảng với 2 chỉ số:
 * - Platform Revenue (Left Y-axis)
 * - Return Rate % (Right Y-axis)
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';
import type { GrowthChartPoint } from '../../types/admin-dashboard';

interface AdminPlatformGrowthChartProps {
  monthlyData: GrowthChartPoint[];
  yearlyData: GrowthChartPoint[];
  loading?: boolean;
}

const AdminPlatformGrowthChart: React.FC<AdminPlatformGrowthChartProps> = ({
  monthlyData,
  yearlyData,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  const formatCurrencyFull = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare chart data based on view mode
  const data = viewMode === 'monthly' ? monthlyData : yearlyData;
  const chartData = data.map((point) => ({
    label: point.month > 0 ? `Tháng ${point.month}/${point.year}` : `Năm ${point.year}`,
    'Doanh thu nền tảng': point.platformRevenue,
    'Tỷ lệ hoàn hàng (%)': point.returnRate
  }));

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Chưa có dữ liệu biểu đồ
          </h3>
          <p className="text-gray-500">
            Không có dữ liệu tăng trưởng để hiển thị
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Biểu đồ tăng trưởng nền tảng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Doanh thu phí nền tảng và tỷ lệ hoàn hàng
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              viewMode === 'monthly'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Theo tháng
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              viewMode === 'yearly'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Theo năm
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          {/* Left Y-Axis for Revenue */}
          <YAxis
            yAxisId="left"
            stroke="#8b5cf6"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          {/* Right Y-Axis for Return Rate */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ef4444"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (value === undefined) return ['0', name || ''];
              if (name === 'Doanh thu nền tảng') {
                return [formatCurrencyFull(value), name];
              }
              return [formatPercent(value), name || ''];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Doanh thu nền tảng"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Tỷ lệ hoàn hàng (%)"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Info */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <p className="text-sm font-medium text-gray-700">Doanh thu nền tảng</p>
          </div>
          <p className="text-xs text-gray-600">
            Tổng phí nền tảng thu được từ các đơn hàng đã giao
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <p className="text-sm font-medium text-gray-700">Tỷ lệ hoàn hàng</p>
          </div>
          <p className="text-xs text-gray-600">
            % yêu cầu hoàn hàng hợp lệ trên tổng đơn đã giao
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPlatformGrowthChart;

