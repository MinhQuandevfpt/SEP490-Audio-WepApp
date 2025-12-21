/**
 * Orders Bar Chart Component
 * Biểu đồ cột thể hiện số lượng đơn hàng đã giao theo thời gian
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Package } from 'lucide-react';
import type { GrowthData } from '../../types/dashboard';

interface OrdersBarChartProps {
  growth: GrowthData | null;
  loading?: boolean;
}

const OrdersBarChart: React.FC<OrdersBarChartProps> = ({ growth, loading = false }) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Prepare chart data
  const chartData = growth?.points.map((point) => ({
    label: point.month ? `Tháng ${point.month}` : `Năm ${point.year}`,
    'Đơn đã giao': point.deliveredOrderCount,
    'Sản phẩm bán': point.itemsSold
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
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Chưa có dữ liệu đơn hàng
          </h3>
          <p className="text-gray-500">
            Chọn năm để xem biểu đồ đơn hàng
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
            Đơn hàng đã giao
          </h2>
          <p className="text-sm text-gray-500">
            {growth.granularity === 'MONTH'
              ? `Theo tháng trong năm ${growth.year}`
              : 'Theo năm'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Đơn đã giao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Sản phẩm bán</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number | undefined) => value !== undefined ? formatNumber(value) : '0'}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar
            dataKey="Đơn đã giao"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="Sản phẩm bán"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersBarChart;

