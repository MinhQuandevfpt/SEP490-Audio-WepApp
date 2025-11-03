import React from 'react';
import type { OrderDetail } from '../../data/orderHistory';
import TimelineStatus from './TimelineStatus';
import { X } from 'lucide-react';

interface Props {
  order: OrderDetail | null;
  onClose: () => void;
}

const OrderDetailModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;
  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng {order.code}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <p className="text-sm text-gray-600">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              <p className="text-sm text-gray-600">Phương thức thanh toán: {order.paymentMethod}</p>
              <p className="text-sm text-gray-600">Vận chuyển: {order.shippingMethod}</p>
              <p className="text-sm text-gray-600">Tổng tiền: <span className="font-semibold text-gray-900">{fmt(order.total)}</span></p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">Địa chỉ giao hàng</p>
              <p className="text-sm text-gray-700">{order.address.fullName} • {order.address.phone}</p>
              <p className="text-sm text-gray-600">{order.address.fullAddress}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Tiến trình</p>
              <TimelineStatus items={order.timeline} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Sản phẩm</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {order.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={it.image} alt={it.name} className="w-12 h-12 rounded object-cover border" />
                      <p className="text-sm text-gray-900 truncate" title={it.name}>{it.name}</p>
                    </div>
                    <div className="text-sm text-gray-700">
                      x{it.quantity}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {fmt(it.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {order.status === 'SHIPPING' && <button className="px-3 py-2 rounded border hover:bg-gray-50">Theo dõi đơn</button>}
              {order.status === 'DELIVERED' && <button className="px-3 py-2 rounded border hover:bg-gray-50">Đánh giá</button>}
              {order.status === 'DELIVERED' && <button className="px-3 py-2 rounded border hover:bg-gray-50">Yêu cầu đổi trả</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;


