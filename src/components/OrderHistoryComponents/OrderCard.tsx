import React, { useMemo, useState } from 'react';
import type { CustomerOrder } from '../../types/api';
import { getStatusLabel, getStatusBadgeStyle, formatCurrency, formatDate, canCancelOrder } from '../../utils/orderStatus';
import { Package, Calendar, MapPin, Phone, Store, Truck, Receipt, Copy, Check, ExternalLink, ShoppingBag } from 'lucide-react';
import { Card, Button, message } from 'antd';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';

interface Props {
  order: CustomerOrder;
  ghnOrderData?: Record<string, any>;
  onOrderCancelled?: () => void;
}

const OrderCard: React.FC<Props> = ({ order, ghnOrderData = {}, onOrderCancelled }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedGhnCode, setCopiedGhnCode] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const displayOrderCode = order.orderCode ?? ' - ';
  const statusStyle = getStatusBadgeStyle(order.status);
  const formattedDate = formatDate(order.createdAt);

  const totalItems = useMemo(
    () => order.storeOrders.reduce((sum, so) => sum + so.items.reduce((s, item) => s + item.quantity, 0), 0),
    [order.storeOrders]
  );

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      if (order.status === 'AWAITING_SHIPMENT') {
        await OrderHistoryService.requestCancel(order.id, 'CHANGE_OF_MIND', '');
        message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng.');
      } else {
        await OrderHistoryService.cancel(order.id, 'CHANGE_OF_MIND', '');
        message.success('Hủy đơn hàng thành công');
      }
      setShowCancelModal(false);
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err: any) {
      message.error(err?.message || 'Hủy đơn hàng thất bại');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card
      className="order-card bg-white"
      styles={{
        body: { padding: 0 },
      }}
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 18px rgba(0,0,0,0.07)',
        transition: 'all 0.3s ease',
        borderTop: '3px solid #FF6A00',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      }}
    >
      <div className="flex flex-col gap-4 p-4 md:p-5 lg:flex-row">
        {/* Left column */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="rounded-2xl border border-orange-100 bg-[#FFF4EC] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-gray-900">
                <Package className="w-4 h-4 text-[#FF6A00]" />
                <p className="text-sm font-semibold uppercase tracking-wide text-[#FF6A00]">MÃ ĐƠN</p>
                <p className="text-base font-bold">{displayOrderCode}</p>
              </div>
              <div className="flex flex-col items-start gap-1 text-xs text-gray-500 md:items-end">
                <span style={statusStyle}>{getStatusLabel(order.status)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Store orders */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-sm font-semibold text-gray-900">
                Sản phẩm ({totalItems} món · {order.storeOrders.length} cửa hàng)
              </h3>
            </div>

            <div className="space-y-4">
              {order.storeOrders.map((storeOrder) => (
                <div key={storeOrder.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Store className="w-4 h-4 text-orange-500" />
                      {storeOrder.storeName}
                    </div>
                    <span style={getStatusBadgeStyle(storeOrder.status)} className="text-xs">
                      {getStatusLabel(storeOrder.status)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {storeOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-full w-full p-3 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.unitPrice)} · SL {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
                    <span>Tạm tính: {formatCurrency(storeOrder.totalAmount)}</span>
                    {storeOrder.discountTotal > 0 && (
                      <span className="text-green-600">- Giảm: {formatCurrency(storeOrder.discountTotal)}</span>
                    )}
                    <span className="hidden sm:inline">·</span>
                    <span>Phí ship: {formatCurrency(storeOrder.shippingFee)}</span>
                    <span className="ml-auto font-semibold text-[#FF6A00]">
                      {formatCurrency(storeOrder.grandTotal)}
                    </span>
                  </div>

                  {ghnOrderData[storeOrder.id]?.orderGhn && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">
                        GHN: {ghnOrderData[storeOrder.id].orderGhn}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(ghnOrderData[storeOrder.id].orderGhn);
                            setCopiedGhnCode(storeOrder.id);
                            setTimeout(() => setCopiedGhnCode(null), 2000);
                            message.success('Đã sao chép mã vận đơn');
                          } catch {
                            message.error('Không thể sao chép');
                          }
                        }}
                        className="rounded-full p-1 text-blue-500 hover:bg-blue-100"
                      >
                        {copiedGhnCode === storeOrder.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://donhang.ghn.vn/?order_code=${ghnOrderData[storeOrder.id].orderGhn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 font-semibold text-blue-600"
                      >
                        Theo dõi
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-full space-y-4 md:w-80 lg:w-96">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6A00]" />
              <h4 className="text-sm font-semibold text-gray-900">Địa chỉ giao hàng</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {order.receiverName} · {order.phoneNumber}
              </p>
              <p>{order.addressLine}</p>
              <p className="text-xs text-gray-500">
                {order.street}, {order.ward}, {order.district}, {order.province}
              </p>
              {order.note && (
                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">Ghi chú: {order.note}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-orange-50/60 to-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6A00]" />
              <h4 className="text-sm font-semibold text-gray-900">Tóm tắt đơn hàng</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(order.shippingFeeTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-orange-200 pt-2 text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-[#FF6A00]">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Thao tác</h4>
            <div className="space-y-2">
              {order.status === 'SHIPPING' && (
                <Button
                  type="primary"
                  icon={<Truck className="w-4 h-4" />}
                  className="h-10 w-full"
                  style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00', borderRadius: '10px' }}
                >
                  Theo dõi đơn hàng
                </Button>
              )}
              {order.status === 'COMPLETED' && (
                <>
                  <Button
                    type="primary"
                    className="h-10 w-full"
                    style={{ backgroundColor: '#27AE60', borderColor: '#27AE60', borderRadius: '10px' }}
                  >
                    Đánh giá sản phẩm
                  </Button>
                  <Button className="h-10 w-full" style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}>
                    Yêu cầu đổi trả
                  </Button>
                </>
              )}
              {canCancelOrder(order.status) && (
                <Button danger className="h-10 w-full" style={{ borderRadius: '10px' }} onClick={() => setShowCancelModal(true)}>
                  {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                </Button>
              )}
              {order.status === 'UNPAID' && (
                <Button
                  type="primary"
                  className="h-10 w-full"
                  style={{ backgroundColor: '#2D9CDB', borderColor: '#2D9CDB', borderRadius: '10px' }}
                >
                  Thanh toán ngay
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isCancelling && setShowCancelModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Bạn có chắc chắn muốn {order.status === 'AWAITING_SHIPMENT' ? 'gửi yêu cầu hủy' : 'hủy'} đơn hàng này không?
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
                Đóng
              </Button>
              <Button danger className="flex-1" loading={isCancelling} onClick={handleCancelOrder}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OrderCard;
