import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { getStatusBadgeClass, getStatusLabel, formatCurrency, formatDate } from '../../../utils/orderStatus';
import { Package, ArrowRight, ExternalLink, Calendar, Store, Eye } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent orders (3 most recent)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await OrderHistoryService.list({ page: 0, size: 3 });
        setOrders(response.data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải danh sách đơn hàng');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleViewAll = () => {
    navigate('/orders');
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders`, { state: { orderId } });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
          <p className="text-sm text-gray-500 mt-1">3 đơn hàng mới nhất của bạn</p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <span>Xem tất cả</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Bạn chưa có đơn hàng nào.</p>
          <p className="text-sm text-gray-400">Hãy bắt đầu mua sắm ngay!</p>
        </div>
      ) : (
        <>
          {/* Orders list - Enhanced UI */}
          <div className="space-y-4">
            {orders.map((order) => {
              const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);
              
              return (
                <div
                  key={order.id}
                  className="group relative rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Gradient accent on left */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <Package className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500">Mã đơn:</span>
                            <span className="font-mono font-semibold text-gray-900 text-sm truncate">
                              {order.id.slice(0, 8)}...
                            </span>
                          </div>
                          <span className={getStatusBadgeClass(order.status)}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        {/* Order Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Ngày đặt</p>
                              <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Sản phẩm</p>
                              <p className="font-medium text-gray-900">
                                {totalItems} sản phẩm
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Cửa hàng</p>
                              <p className="font-medium text-gray-900">
                                {order.storeOrders.length} {order.storeOrders.length === 1 ? 'cửa hàng' : 'cửa hàng'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total Amount */}
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg px-4 py-3 border border-orange-200">
                          <p className="text-xs text-gray-600 mb-1">Tổng tiền</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(order.grandTotal)}</p>
                          {order.discountTotal > 0 && (
                            <p className="text-xs text-gray-500 line-through mt-1 hidden">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Button - Always show if there are orders */}
          {orders.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Xem tất cả đơn hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;


