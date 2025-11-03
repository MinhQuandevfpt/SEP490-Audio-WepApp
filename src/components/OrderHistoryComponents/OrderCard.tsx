import React from 'react';
import type { OrderDetail } from '../../data/orderHistory';
import { statusBadgeColor } from '../../data/orderHistory';

interface Props {
  order: OrderDetail;
  onView: (code: string) => void;
}

const OrderCard: React.FC<Props> = ({ order, onView }) => {
  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';
  const date = new Date(order.createdAt).toLocaleString('vi-VN');
  return (
    <div className="border rounded-lg bg-white hover:shadow transition p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Mã đơn: <span className="font-semibold text-gray-900">{order.code}</span></div>
        <span className={`px-2 py-1 text-xs rounded ${statusBadgeColor(order.status)}`}>{order.status === 'PENDING' ? 'Chờ xác nhận' : order.status === 'PROCESSING' ? 'Đang xử lý' : order.status === 'SHIPPING' ? 'Đang giao' : order.status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Ngày đặt: {date}</span>
        <span>Tổng tiền: <span className="font-semibold text-gray-900">{fmt(order.total)}</span></span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => onView(order.code)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">Xem chi tiết</button>
      </div>
    </div>
  );
};

export default OrderCard;


