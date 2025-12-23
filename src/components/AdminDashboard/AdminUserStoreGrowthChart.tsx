/**
 * Admin User-Store Growth Chart Component
 * Biểu đồ tăng trưởng customer/store theo năm (12 tháng)
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart2, Users, Store, Calendar } from 'lucide-react';
import type { UserStoreGrowthChartPoint } from '../../types/admin-dashboard';

interface AdminUserStoreGrowthChartProps {
  data: UserStoreGrowthChartPoint[];
  loading?: boolean;
  onYearChange?: (year: number) => void;
}

const AdminUserStoreGrowthChart: React.FC<AdminUserStoreGrowthChartProps> = ({
  data,
  loading = false
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const currentYear = data.length > 0 ? data[0].year : new Date().getFullYear();

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const monthNames = [
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
  ];

  // Prepare chart data
  const chartData = data
    .sort((a, b) => a.month - b.month)
    .map((point) => ({
      month: point.month,
      label: monthNames[point.month - 1],
      'Khách hàng mới': point.newCustomers,
      'Cửa hàng mới': point.newStores
    }));

  // Calculate totals
  const totalCustomers = data.reduce((sum, point) => sum + point.newCustomers, 0);
  const totalStores = data.reduce((sum, point) => sum + point.newStores, 0);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Biểu đồ tăng trưởng Khách hàng & Cửa hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Năm {currentYear}
          </p>
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                chartType === 'line'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Đường
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                chartType === 'bar'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Cột
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Tổng khách hàng mới</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(totalCustomers)}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Tổng cửa hàng mới</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(totalStores)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={450}>
        {chartType === 'line' ? (
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
              tickFormatter={formatNumber}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return '0';
                return formatNumber(value);
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Khách hàng mới"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="Cửa hàng mới"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ fill: '#a855f7', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        ) : (
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
              tickFormatter={formatNumber}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return '0';
                return formatNumber(value);
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="Khách hàng mới" 
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="Cửa hàng mới" 
              fill="#a855f7"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Chart Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <p className="text-sm font-medium text-gray-700">Khách hàng mới</p>
          </div>
          <p className="text-xs text-gray-600">
            Số lượng tài khoản khách hàng mới được tạo trong từng tháng
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <p className="text-sm font-medium text-gray-700">Cửa hàng mới</p>
          </div>
          <p className="text-xs text-gray-600">
            Số lượng cửa hàng mới được đăng ký trong từng tháng
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminUserStoreGrowthChart;

