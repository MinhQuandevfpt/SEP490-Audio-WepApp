import React from 'react';
import type { CustomerOrder } from '../../types/api';
import { 
  getStatusBadgeClass, 
  getStatusLabel, 
  formatCurrency, 
  formatDate,
  canCancelOrder
} from '../../utils/orderStatus';
import { X, Package, MapPin, Phone, Receipt, Store, Truck, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  order: CustomerOrder | null;
  onClose: () => void;
}

const OrderDetailModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;

  const totalItemsCount = order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6 bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h3>
            <p className="text-sm text-gray-500 mt-1">Mã đơn: {order.id}</p>
            {order.externalOrderCode && (
              <p className="text-xs text-gray-400 mt-0.5">Mã thanh toán: {order.externalOrderCode}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Status & Order Info */}
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className={getStatusBadgeClass(order.status)}>
                    {getStatusLabel(order.status)}
                  </span>
                  <div className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                {order.message && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{order.message}</p>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-900">Địa chỉ giao hàng</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {order.receiverName} • {order.phoneNumber}
                  </p>
                  <p className="text-gray-700 pl-6">{order.addressLine}</p>
                  <p className="text-gray-600 pl-6 text-xs">
                    {order.street}, {order.ward}, {order.district}, {order.province}
                  </p>
                  {order.note && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                      <span className="font-medium">Ghi chú: </span>
                      {order.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Store Orders */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-500" />
                  Đơn hàng từ các cửa hàng ({order.storeOrders.length})
                </h4>
                
                {order.storeOrders.map((storeOrder, index) => (
                  <div key={storeOrder.id} className="border rounded-lg p-4 bg-white">
                    {/* Store Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <div>
                        <p className="font-semibold text-gray-900">{storeOrder.storeName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Cửa hàng #{index + 1}</p>
                      </div>
                      <span className={getStatusBadgeClass(storeOrder.status)}>
                        {getStatusLabel(storeOrder.status)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {storeOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Loại: {item.type === 'PRODUCT' ? 'Sản phẩm' : 'Combo'} • 
                              SL: {item.quantity}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {formatCurrency(item.unitPrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-sm">
                              {formatCurrency(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Store Order Summary */}
                    <div className="pt-3 border-t space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(storeOrder.totalAmount)}</span>
                      </div>
                      {storeOrder.discountTotal > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá:</span>
                          <span>-{formatCurrency(storeOrder.discountTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển:</span>
                        <span>{formatCurrency(storeOrder.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                        <span>Tổng tiền:</span>
                        <span className="text-orange-600">{formatCurrency(storeOrder.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="border rounded-lg p-4 bg-white sticky top-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  Tóm tắt đơn hàng
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Số sản phẩm:</span>
                    <span className="font-medium">{totalItemsCount} sản phẩm</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Số cửa hàng:</span>
                    <span className="font-medium">{order.storeOrders.length} cửa hàng</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Tạm tính:</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                    {order.discountTotal > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{formatCurrency(order.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span>{formatCurrency(order.shippingFeeTotal)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t">
                      <span>Tổng cộng:</span>
                      <span className="text-orange-600">{formatCurrency(order.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border rounded-lg p-4 bg-white space-y-2">
                <h4 className="font-semibold text-gray-900 mb-3">Thao tác</h4>
                <div className="space-y-2">
                  {order.status === 'SHIPPING' && (
                    <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                      <Truck className="w-4 h-4" />
                      Theo dõi đơn hàng
                    </button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <>
                      <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
                        Đánh giá sản phẩm
                      </button>
                      <button className="w-full px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium">
                        Yêu cầu đổi trả
                      </button>
                    </>
                  )}
                  {canCancelOrder(order.status) && (
                    <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                      Hủy đơn hàng
                    </button>
                  )}
                  {order.status === 'UNPAID' && (
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                      Thanh toán ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;