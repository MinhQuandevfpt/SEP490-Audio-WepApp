/**
 * Revenue Line Chart Component
 * Biểu đồ đường thể hiện doanh thu theo thời gian
 */

import React from 'react';
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
import { TrendingUp } from 'lucide-react';
import type { GrowthData } from '../../types/dashboard';

interface RevenueLineChartProps {
  growth: GrowthData | null;
  loading?: boolean;
}

const RevenueLineChart: React.FC<RevenueLineChartProps> = ({ growth, loading = false }) => {
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

  // Prepare chart data
  const chartData = growth?.points.map((point) => ({
    label: point.month ? `Tháng ${point.month}` : `Năm ${point.year}`,
    'Doanh thu gộp': point.grossRevenue,
    'Phí nền tảng': point.platformFeePaid,
    'Doanh thu ròng': point.netRevenue
  })) || [];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!growth || chartData.length === 0) {
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
            Chọn năm để xem biểu đồ tăng trưởng doanh thu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Biểu đồ tăng trưởng doanh thu
          </h2>
          <p className="text-sm text-gray-500">
            {growth.granularity === 'MONTH'
              ? `Theo tháng trong năm ${growth.year}`
              : 'Theo năm'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Doanh thu gộp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Phí nền tảng</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Doanh thu ròng</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number | undefined) => value !== undefined ? formatCurrencyFull(value) : '0 ₫'}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Doanh thu gộp"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Phí nền tảng"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ fill: '#a855f7', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Doanh thu ròng"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueLineChart;

