import React, { useState } from 'react';
import type { CustomerOrder } from '../../types/api';
import { getStatusBadgeClass, getStatusLabel, formatCurrency, formatDate } from '../../utils/orderStatus';
import { Package, Calendar, DollarSign, Store, Eye, ShoppingBag, Copy, Check, Truck, ExternalLink, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Note: Eye icon is still used for viewing full order ID, not removed

interface Props {
  order: CustomerOrder;
  ghnOrderData?: Record<string, any>;
}

const OrderCard: React.FC<Props> = ({ order, ghnOrderData = {} }) => {
  const [showFullId, setShowFullId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTrackingGuide, setShowTrackingGuide] = useState<Record<string, boolean>>({});
  const totalItems = order.storeOrders.reduce((sum, so) => sum + so.items.length, 0);
  const storeCount = order.storeOrders.length;

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="border rounded-lg bg-white hover:shadow-md transition-shadow p-5">
      {/* Header: Order ID & Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">Mã đơn:</span>
            <div className="flex items-center gap-2 group">
              <span className="font-semibold text-gray-900">
                {showFullId ? order.id : `${order.id.slice(0, 8)}...`}
              </span>
              <button
                onClick={() => setShowFullId(!showFullId)}
                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                title={showFullId ? "Ẩn mã đơn" : "Xem đầy đủ mã đơn"}
              >
                <Eye className="w-4 h-4" />
              </button>
              {showFullId && (
                <button
                  onClick={handleCopyOrderId}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="Sao chép mã đơn"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
          {order.externalOrderCode && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>Mã thanh toán: {order.externalOrderCode}</span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(order.externalOrderCode!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (error) {
                    console.error('Failed to copy:', error);
                  }
                }}
                className="p-0.5 text-gray-400 hover:text-green-500 transition-colors"
                title="Sao chép mã thanh toán"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
        <span className={getStatusBadgeClass(order.status)}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Date & Time */}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Ngày đặt</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Tổng tiền</p>
            <p className="text-sm font-semibold text-orange-600">{formatCurrency(order.grandTotal)}</p>
            {order.discountTotal > 0 && (
              <p className="text-xs text-gray-500 line-through hidden">{formatCurrency(order.totalAmount)}</p>
            )}
          </div>
        </div>

        {/* Store & Items Count */}
        <div className="flex items-start gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Sản phẩm</p>
            <p className="text-sm font-medium text-gray-900">
              {totalItems} sản phẩm từ {storeCount} {storeCount === 1 ? 'cửa hàng' : 'cửa hàng'}
            </p>
          </div>
        </div>
      </div>

      {/* Shipping Address Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng:</p>
        <p className="text-sm text-gray-900 font-medium">{order.receiverName} • {order.phoneNumber}</p>
        <p className="text-sm text-gray-600">{order.addressLine}</p>
      </div>

      {/* Items Detail - Hiển thị chi tiết tất cả items */}
      {order.storeOrders.length > 0 && (
        <div className="mb-4 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-500" />
              Sản phẩm trong đơn ({totalItems} sản phẩm)
            </h4>
          </div>
          
          <div className="divide-y">
            {order.storeOrders.map((storeOrder) => (
              <div key={storeOrder.id}>
                {/* Store Header */}
                {order.storeOrders.length > 1 && (
                  <div className="bg-orange-50 px-4 py-2 border-b">
                    <p className="text-xs font-medium text-orange-700">
                      {storeOrder.storeName}
                    </p>
                  </div>
                )}
                
                {/* Items in this store */}
                <div className="space-y-2 p-3">
                  {storeOrder.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between gap-3 p-2 bg-white rounded border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Số lượng: <span className="font-medium text-gray-700">{item.quantity}</span></span>
                          <span>•</span>
                          <span>Đơn giá: <span className="font-medium text-gray-700">{formatCurrency(item.unitPrice)}</span></span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-orange-600">
                          {formatCurrency(item.lineTotal)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Store Order Summary */}
                  {order.storeOrders.length > 1 && (
                    <div className="pt-2 mt-2 border-t border-dashed space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính cửa hàng này:</span>
                        <span className="font-medium">{formatCurrency(storeOrder.totalAmount)}</span>
                      </div>
                      {storeOrder.discountTotal > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá:</span>
                          <span className="font-medium">-{formatCurrency(storeOrder.discountTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển:</span>
                        <span className="font-medium">{formatCurrency(storeOrder.shippingFee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                        <span>Tổng cửa hàng:</span>
                        <span className="text-orange-600">{formatCurrency(storeOrder.grandTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* GHN Order Code */}
                  {ghnOrderData[storeOrder.id]?.orderGhn && (
                    <div className="pt-2 mt-2 border-t border-dashed space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Truck className="w-3 h-3 text-blue-500" />
                        <span className="text-gray-600">Mã vận đơn GHN:</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {ghnOrderData[storeOrder.id].orderGhn}
                        </span>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText(ghnOrderData[storeOrder.id].orderGhn);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            } catch (error) {
                              console.error('Failed to copy:', error);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Sao chép mã vận đơn"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTrackingGuide(prev => ({
                              ...prev,
                              [storeOrder.id]: !prev[storeOrder.id]
                            }));
                          }}
                          className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <span>Hướng dẫn theo dõi</span>
                          {showTrackingGuide[storeOrder.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      
                      {/* Tracking Guide - Collapsible */}
                      {showTrackingGuide[storeOrder.id] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">Hướng dẫn theo dõi đơn hàng</span>
                          </div>
                          <ol className="space-y-1.5 text-xs text-blue-800 ml-5 list-decimal">
                            <li>Sao chép mã vận đơn GHN ở trên</li>
                            <li>
                              Truy cập{' '}
                              <a
                                href={`https://donhang.ghn.vn/?order_code=${ghnOrderData[storeOrder.id].orderGhn}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-medium inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                trang theo dõi GHN
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </li>
                            <li>Dán mã vận đơn vào khung nhập mã vận đơn</li>
                            <li>Bấm nút tìm kiếm</li>
                            <li>Theo dõi tình trạng đơn hàng</li>
                          </ol>
                          <a
                            href={`https://donhang.ghn.vn/?order_code=${ghnOrderData[storeOrder.id].orderGhn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Truck className="w-3 h-3" />
                            <span>Theo dõi đơn hàng trên GHN</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;