import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { StoreOrderFilter, StoreOrderCard, StoreOrderDetailModal } from '../../../components/StoreOwnerOrderManagementComponents';
import useStoreOrders from '../../../hooks/useStoreOrders';

const OrderManageForStoreOwner: React.FC = () => {
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
    refresh,
  } = useStoreOrders();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-1">Xem và quản lý tất cả đơn hàng của cửa hàng</p>
      </div>

      {/* Filters */}
      <StoreOrderFilter
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3">Đang tải đơn hàng...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Orders List */}
      {!isLoading && !error && (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <StoreOrderCard 
                key={order.id} 
                order={order} 
                onView={viewDetail}
                onAssignSuccess={refresh}
              />
            ))}
            {orders.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.</p>
              </div>
            )}
          </div>

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
                      <option value={25}>25 đơn hàng</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <span className="text-sm text-gray-500">/ trang</span>
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
        </>
      )}

      {/* Order Detail Modal */}
      <StoreOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};

export default OrderManageForStoreOwner;

