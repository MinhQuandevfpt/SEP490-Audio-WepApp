import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { OrderFilterTabs, OrderCard, OrderDetailModal } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { Home, ChevronRight, Package, ChevronDown } from 'lucide-react';

const OrderHistoryPage: React.FC = () => {
  const location = useLocation();
  const {
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    orders,
    isLoading,
    error,
    selectedOrder,
    setSelectedOrder,
    viewDetail,
  } = useOrderHistory();

  // Auto-open order detail modal if orderId is passed via navigation state
  useEffect(() => {
    const state = location.state as { orderId?: string } | null;
    if (state?.orderId) {
      viewDetail(state.orderId);
      // Clear the state to avoid reopening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, viewDetail]);

  return (
    <Layout>
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header + Breadcrumb */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4" />
              <span>Tài khoản</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">Đơn hàng của tôi</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
            <OrderFilterTabs value={status} onChange={setStatus} search={search} onSearchChange={setSearch} />

            {isLoading ? (
              <div className="py-16 text-center text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-3">Đang tải đơn hàng...</p>
              </div>
            ) : error ? (
              <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                    <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.</p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination & Page Size Selector */}
            {orders.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Hiển thị:</label>
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                      >
                        <option value={5}>5 đơn hàng</option>
                        <option value={10}>10 đơn hàng</option>
                        <option value={15}>15 đơn hàng</option>
                        <option value={20}>20 đơn hàng</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <span className="text-sm text-gray-500">
                      / trang
                    </span>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPage(Math.max(1, page - 1))} 
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        disabled={page === 1}
                      >
                        Trước
                      </button>
                      <span className="text-sm text-gray-700 px-4">
                        Trang {page} / {totalPages}
                      </span>
                      <button 
                        onClick={() => setPage(Math.min(totalPages, page + 1))} 
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        disabled={page === totalPages}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </Layout>
  );
};

export default OrderHistoryPage;

