import React from 'react';
import { X, User, Phone, MapPin, DollarSign, ShoppingBag } from 'lucide-react';
import type { StoreOrder } from '../../types/seller';
import { getStatusBadgeClass, getStatusLabel, formatCurrency, formatDate } from '../../utils/storeOrderStatus';

interface Props {
  order: StoreOrder | null;
  onClose: () => void;
}

const StoreOrderDetailModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Mã đơn: {order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Status & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Trạng thái đơn hàng</label>
              <div className="mt-1">
                <span className={getStatusBadgeClass(order.status)}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Ngày đặt hàng</label>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Tên khách hàng</p>
                <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã đơn khách hàng</p>
                <p className="text-sm font-mono text-gray-900">{order.customerOrderId}</p>
              </div>
              {order.customerMessage && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Lời nhắn</p>
                  <p className="text-sm text-gray-900">{order.customerMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Địa chỉ giao hàng
            </h3>
            <div className="space-y-2">
              {/* Receiver Name & Phone */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{order.shipReceiverName}</p>
                <span className="text-gray-400">·</span>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.shipPhoneNumber}
                </p>
              </div>
              {/* Street + AddressLine */}
              {([order.shipStreet, order.shipAddressLine].filter(Boolean) as string[]).length > 0 && (
                <p className="text-sm text-gray-700">
                  {([order.shipStreet, order.shipAddressLine].filter(Boolean) as string[]).join(', ')}
                </p>
              )}
              {/* Ward, District, Province */}
              {([order.shipWard, order.shipDistrict, order.shipProvince].filter(Boolean) as string[]).length > 0 && (
                <p className="text-sm text-gray-700">
                  {([order.shipWard, order.shipDistrict, order.shipProvince].filter(Boolean) as string[]).join(', ')}
                </p>
              )}
              {/* Country + PostalCode */}
              {(order.shipCountry || order.shipPostalCode) && (
                <p className="text-xs text-gray-500">
                  {[order.shipCountry, order.shipPostalCode].filter(Boolean).join(' - ')}
                </p>
              )}
              {/* Note if exists */}
              {order.shipNote && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Ghi chú:</p>
                  <p className="text-sm text-gray-700">{order.shipNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Sản phẩm ({totalItems} sản phẩm)
              </h3>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Số lượng: <span className="font-medium text-gray-700">{item.quantity}</span></span>
                        <span>•</span>
                        <span>Đơn giá: <span className="font-medium text-gray-700">{formatCurrency(item.unitPrice)}</span></span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-orange-600">
                        {formatCurrency(item.lineTotal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4 bg-orange-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Tổng kết đơn hàng
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="font-medium text-green-600">-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="pt-2 border-t border-orange-200 flex justify-between">
                <span className="font-semibold text-gray-900">Tổng cộng:</span>
                <span className="text-lg font-bold text-orange-600">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreOrderDetailModal;

