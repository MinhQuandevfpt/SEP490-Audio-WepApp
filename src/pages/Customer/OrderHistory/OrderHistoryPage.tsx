import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { OrderFilterTabs, OrderCard, OrderDetailModal } from '../../../components/OrderHistoryComponents';
import useOrderHistory from '../../../hooks/useOrderHistory';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import { showError, showSuccess } from '../../../utils/notification';
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
    reload,
  } = useOrderHistory();

  // Cancel modal state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

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
                  <div key={order.id}>
                    <OrderCard order={order} />
                    {order.status === 'PENDING' && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => {
                            setCancelTargetId(order.id);
                            setCancelReason('CHANGE_OF_MIND');
                            setCancelNote('');
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Hủy đơn hàng
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* Cancel Order Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Hủy đơn hàng</h3>
              <p className="text-sm text-gray-500 mt-1">Chỉ có thể hủy khi trạng thái đơn là PENDING.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="CHANGE_OF_MIND">Đổi ý</option>
                  <option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</option>
                  <option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</option>
                  <option value="ORDERED_BY_ACCIDENT">Đặt nhầm</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="VD: Đặt nhầm phiên bản"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[90px]"
                />
                <p className="text-xs text-gray-400 mt-1">Ghi chú sẽ gửi kèm yêu cầu hủy.</p>
              </div>
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => !isCancelling && setCancelTargetId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                disabled={isCancelling}
              >
                Đóng
              </button>
              <button
                onClick={async () => {
                  if (!cancelTargetId) return;
                  try {
                    setIsCancelling(true);
                    await OrderHistoryService.cancel(cancelTargetId, cancelReason, cancelNote);
                    showSuccess('Hủy đơn hàng thành công');
                    setCancelTargetId(null);
                    await reload();
                  } catch (err: any) {
                    showError(err?.message || 'Hủy đơn hàng thất bại');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderHistoryPage;

