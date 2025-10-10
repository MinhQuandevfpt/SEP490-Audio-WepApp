import React from 'react';
import { loadProfileData } from '../../../data/profiledata';

interface OrderItem {
  id: string;
  date: string;
  total: number;
  status: string; // Đã giao | Đang giao | Đã hủy | Chuẩn bị hàng | Đã tiếp nhận
}

interface OrderHistoryProps {
  orders: OrderItem[];
}

const formatCurrency = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

const statusStyle = (status: string) => {
  switch (status) {
    case 'Đã giao':
      return 'bg-green-100 text-green-700';
    case 'Đang giao':
      return 'bg-blue-100 text-blue-700';
    case 'Chuẩn bị hàng':
      return 'bg-amber-100 text-amber-700';
    case 'Đã tiếp nhận':
      return 'bg-purple-100 text-purple-700';
    case 'Đã hủy':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const sorted = [...orders].sort((a, b) => (a.date < b.date ? 1 : -1));

  // Pagination: 5 per page
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Build monthly spending for a simple bar chart (last 6 months present in data)
  // Source: profiledata.ts to ensure chart always uses global data
  const monthlyMap = new Map<string, number>(); // key: YYYY-MM
  const sourceOrders = React.useMemo(() => loadProfileData().orders, []);
  sourceOrders.forEach((o) => {
    const d = new Date(o.date);
    if (!Number.isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + o.total);
    }
  });
  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-6);
  const maxSpend = Math.max(1, ...monthly.map(([, v]) => v));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
        <span className="text-sm text-gray-500">Tổng: {orders.length}</span>
      </div>

      {/* Monthly spend bar chart */}
      {monthly.length > 0 && (
        <div className="mb-6">
          <div className="flex items-end gap-3 h-28">
            {monthly.map(([label, value]) => (
              <div key={label} className="flex-1">
                <div
                  className="w-full bg-gradient-to-t from-orange-400 to-orange-500 rounded-md"
                  style={{ height: `${Math.max(8, Math.round((value / maxSpend) * 100))}%` }}
                  title={`${label}: ${formatCurrency(value)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            {monthly.map(([label]) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((order) => (
              <div
                key={order.id}
                className="group rounded-lg border border-gray-200 hover:border-orange-200 hover:bg-orange-50/40 transition-colors"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900 truncate">Mã đơn: {order.id}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyle(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">Ngày: {order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <button className="mt-1 text-sm text-orange-600 hover:text-orange-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Trang {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistory;


