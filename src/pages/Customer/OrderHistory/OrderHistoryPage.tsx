import React from 'react';
import Layout from '../../../components/Layout';
import { OrderFilterTabs, OrderCard, OrderDetailModal } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { Home, ChevronRight } from 'lucide-react';

const OrderHistoryPage: React.FC = () => {
  const {
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    orders,
    isLoading,
    error,
    selectedOrder,
    setSelectedOrder,
    viewDetail,
  } = useOrderHistory();

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
                {orders.map(o => (
                  <OrderCard key={o.code} order={o} onView={viewDetail} />
                ))}
                {orders.length === 0 && (
                  <div className="text-center text-sm text-gray-600 py-12">Không có đơn hàng phù hợp.</div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} className="px-3 py-1.5 border rounded disabled:opacity-50" disabled={page === 1}>Trước</button>
                <span className="text-sm text-gray-700">Trang {page}/{totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="px-3 py-1.5 border rounded disabled:opacity-50" disabled={page === totalPages}>Sau</button>
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

