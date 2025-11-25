import React, { useState } from 'react';
import type { StoreOrder } from '../../types/seller';
import { getStatusBadgeClass, getStatusLabel, formatCurrency, formatDate } from '../../utils/storeOrderStatus';
import { Package, Calendar, User, Phone, MapPin, ShoppingBag, Eye, EyeOff, PackageCheck, Truck } from 'lucide-react';
import { StoreOrderService } from '../../services/seller/OrderService';
import { showCenterSuccess, showCenterError } from '../../utils/notification';
import GhnTransferModal from './GhnTransferModal';

interface Props {
  order: StoreOrder;
  onView: (orderId: string) => void;
  onStatusUpdate?: () => void; // Callback khi status update thành công để refresh list
}

const StoreOrderCard: React.FC<Props> = ({ order, onView, onStatusUpdate }) => {
  const [showFullCode, setShowFullCode] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showGhnModal, setShowGhnModal] = useState(false);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const handlePrepareOrder = async () => {
    if (order.status !== 'PENDING') {
      showCenterError('Chỉ có thể chuẩn bị đơn hàng ở trạng thái "Chờ xử lý"', 'Lỗi');
      return;
    }

    try {
      setIsPreparing(true);
      await StoreOrderService.updateOrderStatus(order.id, 'AWAITING_SHIPMENT');
      showCenterSuccess('Đơn hàng đã được chuyển sang trạng thái "Chờ lấy hàng"', 'Thành công');
      onStatusUpdate?.();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể chuẩn bị đơn hàng', 'Lỗi');
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="border rounded-lg bg-white hover:shadow-md transition-shadow p-5">
      {/* Header: Order ID & Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">Mã đơn hàng:</span>
            <span className="font-mono font-semibold text-gray-900 text-sm">
              {showFullCode ? order.id : `${order.id.slice(0, 8)}...`}
            </span>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title={showFullCode ? 'Thu gọn mã' : 'Hiển thị đầy đủ mã'}
            >
              {showFullCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Đơn khách hàng: <span className="font-medium">
              {showFullCode ? order.customerOrderId : `${order.customerOrderId.slice(0, 8)}...`}
            </span>
          </div>
        </div>
        <span className={getStatusBadgeClass(order.status)}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Khách hàng</p>
            <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" />
              {order.customerPhone}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Ngày đặt</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng:</p>
            {/* Receiver Name & Phone */}
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-900">{order.shipReceiverName}</p>
              <span className="text-gray-400">·</span>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.shipPhoneNumber}
              </p>
            </div>
            {/* AddressLine, Street, Ward, District, Province */}
            {([order.shipAddressLine, order.shipStreet, order.shipWard, order.shipDistrict, order.shipProvince].filter(Boolean) as string[]).length > 0 && (
              <p className="text-sm text-gray-700 mb-1">
                {([order.shipAddressLine, order.shipStreet, order.shipWard, order.shipDistrict, order.shipProvince].filter(Boolean) as string[]).join(', ')}
              </p>
            )}
            {/* Country - PostalCode */}
            {(order.shipCountry || order.shipPostalCode) && (
              <p className="text-xs text-gray-600">
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
      </div>

      {/* Order Items Preview */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Sản phẩm ({totalItems} sản phẩm):</span>
        </div>
        <div className="space-y-1">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate flex-1">
                {item.name} × {item.quantity}
              </span>
              <span className="text-gray-900 font-medium ml-2">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-xs text-gray-500 mt-1">
              +{order.items.length - 2} sản phẩm khác
            </p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm">
          <p className="text-gray-600">Tổng tiền:</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(order.grandTotal)}</p>
          {order.discountTotal > 0 && (
            <p className="text-xs text-gray-500 line-through mt-1">
              {formatCurrency(order.totalAmount)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'PENDING' && (
            <button
              onClick={handlePrepareOrder}
              disabled={isPreparing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Xác nhận lên đơn hàng"
            >
              {isPreparing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Xác nhận lên đơn hàng</span>
                </>
              )}
            </button>
          )}
          {order.status === 'AWAITING_SHIPMENT' && (
            <button
              onClick={() => setShowGhnModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              title="Chuyển nhượng GHN"
            >
              <Truck className="w-4 h-4" />
              <span>Chuyển nhượng GHN</span>
            </button>
          )}
          <button
            onClick={() => onView(order.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>

      {/* GHN Transfer Modal */}
      {showGhnModal && (
        <GhnTransferModal
          orderId={order.id}
          storeOrderTotal={order.grandTotal}
          onClose={() => setShowGhnModal(false)}
          onSubmit={(data) => {
            console.log('GHN Transfer Data:', data);
            // TODO: Gọi API khi đã sẵn sàng
            setShowGhnModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StoreOrderCard;

