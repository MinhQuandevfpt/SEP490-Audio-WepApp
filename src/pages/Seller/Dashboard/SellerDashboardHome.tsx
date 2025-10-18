import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Eye,
  Star,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardStats } from '../../../types/seller';

const SellerDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockStats: DashboardStats = {
        totalRevenue: 125500000,
        totalOrders: 1234,
        totalProducts: 156,
        pendingOrders: 23,
        completedOrders: 1089,
        cancelledOrders: 122,
        lowStockProducts: 12,
        outOfStockProducts: 5,
        revenueGrowth: 15.5,
        ordersGrowth: 8.3
      };
      
      setTimeout(() => {
        setStats(mockStats);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const statCards = [
    {
      title: 'Doanh thu tháng này',
      value: stats ? formatCurrency(stats.totalRevenue) : '...',
      change: stats?.revenueGrowth || 0,
      changeLabel: 'so với tháng trước',
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/seller/dashboard/finance'
    },
    {
      title: 'Đơn hàng',
      value: stats ? formatNumber(stats.totalOrders) : '...',
      change: stats?.ordersGrowth || 0,
      changeLabel: 'so với tháng trước',
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/seller/dashboard/orders'
    },
    {
      title: 'Sản phẩm',
      value: stats ? formatNumber(stats.totalProducts) : '...',
      change: 0,
      changeLabel: 'Tổng sản phẩm',
      icon: Package,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      link: '/seller/dashboard/products'
    },
    {
      title: 'Chờ xử lý',
      value: stats ? formatNumber(stats.pendingOrders) : '...',
      change: 0,
      changeLabel: 'Đơn cần xác nhận',
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/seller/dashboard/orders/pending',
      isAlert: true
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 h-40"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Xin chào! Đây là tổng quan về cửa hàng của bạn.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change > 0;
          
          return (
            <Link
              key={index}
              to={card.link}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                {card.isAlert && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Mới
                  </span>
                )}
              </div>
              
              <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">{card.value}</p>
              
              {card.change !== 0 ? (
                <div className="flex items-center text-sm">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-gray-500 ml-1">{card.changeLabel}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{card.changeLabel}</p>
              )}
              
              <div className="mt-4 flex items-center text-orange-600 text-sm font-medium group-hover:text-orange-700">
                Xem chi tiết
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Cảnh báo & Thông báo</h2>
          <div className="space-y-3">
            {stats && stats.outOfStockProducts > 0 && (
              <Link
                to="/seller/dashboard/products/out-of-stock"
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.outOfStockProducts} sản phẩm hết hàng
                    </p>
                    <p className="text-xs text-gray-600">Cần nhập hàng ngay</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </Link>
            )}
            
            {stats && stats.lowStockProducts > 0 && (
              <Link
                to="/seller/dashboard/products/low-stock"
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.lowStockProducts} sản phẩm sắp hết
                    </p>
                    <p className="text-xs text-gray-600">Tồn kho thấp</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-yellow-600" />
              </Link>
            )}
            
            {stats && stats.pendingOrders > 0 && (
              <Link
                to="/seller/dashboard/orders/pending"
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {stats.pendingOrders} đơn hàng chờ xác nhận
                    </p>
                    <p className="text-xs text-gray-600">Cần xử lý ngay</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/seller/dashboard/products/add"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <Package className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Thêm sản phẩm</p>
            </Link>
            
            <Link
              to="/seller/dashboard/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Quản lý đơn hàng</p>
            </Link>
            
            <Link
              to="/seller/dashboard/marketing/promotions"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Tạo khuyến mãi</p>
            </Link>
            
            <Link
              to="/seller/dashboard/analytics"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <Eye className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Xem báo cáo</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Đơn hàng gần đây</h2>
            <Link to="/seller/dashboard/orders" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Xem tất cả
            </Link>
          </div>
          
          <div className="space-y-3">
            {/* Mock recent orders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Đơn hàng #DH{10000 + i}</p>
                    <p className="text-xs text-gray-600">2 phút trước</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(1500000 * i)}</p>
                  <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    Chờ xác nhận
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Sản phẩm bán chạy</h2>
            <Link to="/seller/dashboard/products" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Xem tất cả
            </Link>
          </div>
          
          <div className="space-y-3">
            {/* Mock top products */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Tai nghe Sony WH-1000XM{i}</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">4.{i} (123)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{i * 50} đã bán</p>
                  <p className="text-xs text-gray-600">{formatCurrency(5000000 + i * 100000)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardHome;
