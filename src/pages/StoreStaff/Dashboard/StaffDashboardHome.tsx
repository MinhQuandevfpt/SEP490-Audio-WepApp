import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Users, Shield, ArrowUpRight, TrendingUp, TrendingDown, ClipboardList, Headphones } from 'lucide-react';
import { showCenterSuccess } from '../../../utils/notification';

const StaffDashboardHome: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState({
    todayOrders: 18,
    pendingOrders: 7,
    deliveredToday: 5,
    customersHelped: 12,
    performance: 6.4,
  });

  useEffect(() => {
    // Check for login success message
    const loginSuccess = sessionStorage.getItem('staffLoginSuccess');
    if (loginSuccess) {
      try {
        const { message } = JSON.parse(loginSuccess);
        showCenterSuccess(message, 'Thành công');
        sessionStorage.removeItem('staffLoginSuccess');
      } catch (error) {
        console.error('Error parsing staff login success message:', error);
        sessionStorage.removeItem('staffLoginSuccess');
      }
    }

    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stats.performance >= 0;

  const statCards = [
    {
      title: 'Đơn hàng',
      value: stats.todayOrders,
      change: stats.performance,
      changeLabel: 'so với hôm qua',
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/store-staff/orders'
    },
    {
      title: 'Đang xử lý',
      value: stats.pendingOrders,
      change: 0,
      changeLabel: 'Đơn chờ xác nhận',
      icon: Package,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/store-staff/orders/pending',
      isAlert: true
    },
    {
      title: 'Đã giao hôm nay',
      value: stats.deliveredToday,
      change: 0,
      changeLabel: 'Đã hoàn tất',
      icon: Shield,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/store-staff/orders/delivered'
    },
    {
      title: 'Khách đã hỗ trợ',
      value: stats.customersHelped,
      change: 0,
      changeLabel: 'Tương tác hôm nay',
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      link: '/store-staff/customers'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
          <p className="text-gray-600 mt-1">Xin chào! Đây là tổng quan công việc của bạn hôm nay.</p>
        </div>
        <Link to="/store-staff/orders" className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium">
          Xem đơn hàng
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isPositiveCard = (card.change || 0) > 0;
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
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">Mới</span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">{card.value}</p>
              {card.change !== 0 ? (
                <div className="flex items-center text-sm">
                  {isPositiveCard ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={isPositiveCard ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(card.change || 0)}%
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Cảnh báo & Thông báo</h2>
          <div className="space-y-3">
            <Link to="/store-staff/orders/pending" className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
              <div className="flex items-center">
                <ClipboardList className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{stats.pendingOrders} đơn chờ xử lý</p>
                  <p className="text-xs text-gray-600">Cần xác nhận nhanh</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-yellow-600" />
            </Link>
            <Link to="/store-staff/customers" className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <Headphones className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Hỗ trợ khách hàng</p>
                  <p className="text-xs text-gray-600">Kiểm tra ticket mới</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">Hiệu suất hôm nay</h2>
            <div className="flex items-center text-sm">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.performance)}%
              </span>
              <span className="text-gray-500 ml-1">so với hôm qua</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Tiếp tục duy trì nhịp xử lý đơn và phản hồi khách hàng nhanh chóng.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Đơn gần đây</h2>
            <Link to="/store-staff/orders" className="text-sm text-orange-600 hover:text-orange-700 font-medium">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Đơn hàng #ST{1000 + i}</p>
                    <p className="text-xs text-gray-600">vài phút trước</p>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Chờ xử lý</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Thao tác nhanh</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/store-staff/orders/pending"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <ClipboardList className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Xác nhận đơn</p>
            </Link>
            <Link
              to="/store-staff/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <Package className="w-6 h-6 text-gray-600 group-hover:text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">Cập nhật trạng thái</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Sản phẩm bán chạy</h2>
          <Link to="/seller/dashboard/products" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            Xem tất cả
          </Link>
        </div>
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Tai nghe Sony WH-1000XM{i}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-600">{50 + i} đã bán</div>
                </div>
              </div>
              <span className="text-xs text-gray-500">Kho: {100 - i}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardHome;


