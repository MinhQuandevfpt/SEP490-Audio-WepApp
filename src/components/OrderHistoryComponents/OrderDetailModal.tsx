import React from 'react';
import { Modal, Button, Select, Input, Space, message } from 'antd';
import type { CustomerOrder } from '../../types/api';
import { 
  getStatusBadgeClass, 
  getStatusLabel, 
  formatCurrency, 
  formatDate,
  canCancelOrder
} from '../../utils/orderStatus';
import { X, Package, MapPin, Phone, Receipt, Store, Truck, Calendar, Copy, Check, ExternalLink, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';
import ReturnRequestModal from './ReturnRequestModal';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  order: CustomerOrder | null;
  onClose: () => void;
  ghnOrderData?: Record<string, any>;
  onOrderCancelled?: () => void;
}

const resolveOrderItemImage = (item: { image?: string | null; variantId?: string | null; variantUrl?: string | null }) => {
  if (item.variantId) {
    return item.variantUrl || item.image || undefined;
  }
  return item.image || item.variantUrl || undefined;
};

const formatVariantLabel = (item: { variantOptionName?: string | null; variantOptionValue?: string | null }) => {
  if (!item.variantOptionName || !item.variantOptionValue) return null;
  return `${item.variantOptionName}: ${item.variantOptionValue}`;
};

const OrderDetailModal: React.FC<Props> = ({ order, onClose, ghnOrderData = {}, onOrderCancelled }) => {
  if (!order) return null;

  const [copiedGhnCode, setCopiedGhnCode] = React.useState<string | null>(null);
  const [showTrackingGuide, setShowTrackingGuide] = React.useState<Record<string, boolean>>({});
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = React.useState<string>('');
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [showReturnModal, setShowReturnModal] = React.useState(false);
  const totalItemsCount = Array.isArray(order.storeOrders) 
    ? order.storeOrders.reduce((sum, so) => {
        if (!Array.isArray(so.items)) return sum;
        return sum + so.items.reduce((s, item) => s + (item.quantity || 0), 0);
      }, 0)
    : 0;

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      
      // Use different API based on order status
      if (order.status === 'AWAITING_SHIPMENT') {
        await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
        message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng. Vui lòng chờ cửa hàng xem xét.');
      } else {
        await OrderHistoryService.cancel(order.id, cancelReason, cancelNote);
        message.success('Hủy đơn hàng thành công');
      }
      
      setShowCancelModal(false);
      setCancelReason('CHANGE_OF_MIND');
      setCancelNote('');
      if (onOrderCancelled) {
        onOrderCancelled();
      }
      onClose();
    } catch (err: any) {
      message.error(err?.message || (order.status === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy đơn hàng thất bại' : 'Hủy đơn hàng thất bại'));
    } finally {
      setIsCancelling(false);
    }
  };

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
            <p className="text-sm text-gray-500 mt-1">Mã đơn: {order.orderCode ?? ' - '}</p>
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
                <div className="flex items-center justify-between">
                  <span className={getStatusBadgeClass(order.status)}>
                    {getStatusLabel(order.status)}
                  </span>
                  <div className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
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
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
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
                  Đơn hàng từ các cửa hàng ({Array.isArray(order.storeOrders) ? order.storeOrders.length : 0})
                </h4>
                
                {Array.isArray(order.storeOrders) && order.storeOrders.length > 0 ? (
                  order.storeOrders.map((storeOrder) => {
                  // Truncate store name: show first 2 chars + "..." + last 2 chars if long
                  const storeName = storeOrder.storeName || '';
                  const displayStoreName = storeName.length > 8 
                    ? `${storeName.substring(0, 2)}...${storeName.substring(storeName.length - 2)}`
                    : storeName;
                  
                  return (
                    <div key={storeOrder.id} className="border rounded-lg p-4 bg-white">
                      {/* Store Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b">
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-semibold text-gray-400 truncate"
                            title={storeOrder.storeName}
                            style={{ 
                              fontSize: '14px',
                              opacity: 0.6
                            }}
                          >
                            {displayStoreName}
                          </p>
                        </div>
                        <span className={getStatusBadgeClass(storeOrder.status)}>
                          {getStatusLabel(storeOrder.status)}
                        </span>
                      </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {Array.isArray(storeOrder.items) && storeOrder.items.length > 0 ? (
                        storeOrder.items.map((item) => {
                          const itemImage = resolveOrderItemImage(item);
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {itemImage ? (
                                  <img 
                                    src={itemImage} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                              {formatVariantLabel(item) && (
                                <p className="text-xs text-gray-500 mt-0.5">{formatVariantLabel(item)}</p>
                              )}
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
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Không có sản phẩm</p>
                      )}
                    </div>

                    {/* GHN Order Code */}
                    {ghnOrderData[storeOrder.id]?.orderGhn && (
                      <div className="pt-3 mt-2 border-t border-dashed space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600">Mã vận đơn GHN:</span>
                          <span className="font-mono font-semibold text-blue-600">
                            {ghnOrderData[storeOrder.id].orderGhn}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(ghnOrderData[storeOrder.id].orderGhn);
                                setCopiedGhnCode(storeOrder.id);
                                setTimeout(() => setCopiedGhnCode(null), 2000);
                              } catch (error) {
                                console.error('Failed to copy:', error);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Sao chép mã vận đơn"
                          >
                            {copiedGhnCode === storeOrder.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowTrackingGuide(prev => ({
                                ...prev,
                                [storeOrder.id]: !prev[storeOrder.id]
                              }));
                            }}
                            className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <span>Hướng dẫn theo dõi</span>
                            {showTrackingGuide[storeOrder.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        
                        {/* Tracking Guide - Collapsible */}
                        {showTrackingGuide[storeOrder.id] && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">Hướng dẫn theo dõi đơn hàng</span>
                            </div>
                            <ol className="space-y-1.5 text-sm text-blue-800 ml-5 list-decimal">
                              <li>Sao chép mã vận đơn GHN ở trên</li>
                              <li>
                                Truy cập{' '}
                                <a
                                  href={`https://donhang.ghn.vn/?order_code=${ghnOrderData[storeOrder.id].orderGhn}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-medium inline-flex items-center gap-1"
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
                              className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Theo dõi đơn hàng trên GHN</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Không có đơn hàng từ cửa hàng</p>
                )}
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
                    <Button 
                      type="primary"
                      className="w-full"
                      icon={<Truck className="w-4 h-4" />}
                      style={{ 
                        backgroundColor: '#f97316',
                        borderColor: '#f97316',
                        borderRadius: '8px',
                        height: '40px'
                      }}
                    >
                      Theo dõi đơn hàng
                    </Button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <>
                      <Button 
                        type="primary"
                        className="w-full"
                        style={{ 
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                          borderRadius: '8px',
                          height: '40px'
                        }}
                      >
                        Đánh giá sản phẩm
                      </Button>
                      <Button 
                        className="w-full"
                        style={{ 
                          borderColor: '#f97316',
                          color: '#f97316',
                          borderRadius: '8px',
                          height: '40px'
                        }}
                      >
                        Yêu cầu đổi trả
                      </Button>
                    </>
                  )}
                  {order.status === 'DELIVERY_SUCCESS' && (
                    <Button
                      className="w-full"
                      style={{
                        borderColor: '#f97316',
                        color: '#f97316',
                        borderRadius: '8px',
                        height: '40px',
                      }}
                      onClick={() => setShowReturnModal(true)}
                    >
                      Hoàn trả sản phẩm
                    </Button>
                  )}
                  {canCancelOrder(order.status) && (
                    <Button 
                      danger
                      className="w-full"
                      onClick={() => {
                        setShowCancelModal(true);
                        setCancelReason('CHANGE_OF_MIND');
                        setCancelNote('');
                      }}
                      style={{ 
                        borderRadius: '8px',
                        height: '40px'
                      }}
                    >
                      {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                    </Button>
                  )}
                  {order.status === 'UNPAID' && (
                    <Button 
                      type="primary"
                      className="w-full"
                      style={{ 
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        borderRadius: '8px',
                        height: '40px'
                      }}
                    >
                      Thanh toán ngay
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-semibold">
              {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
            </span>
          </div>
        }
        open={showCancelModal}
        onCancel={() => {
          if (!isCancelling) {
            setShowCancelModal(false);
          }
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              if (!isCancelling) {
                setShowCancelModal(false);
              }
            }} 
            disabled={isCancelling}
            size="large"
            style={{ borderRadius: '8px' }}
          >
            Đóng
          </Button>,
          <Button
            key="confirm"
            danger
            loading={isCancelling}
            size="large"
            onClick={handleCancelOrder}
            style={{ borderRadius: '8px' }}
          >
            {order.status === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
          </Button>,
        ]}
        styles={{ 
          body: { padding: '24px' },
          header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }
        }}
      >
        <Space direction="vertical" size="large" className="w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              {order.status === 'AWAITING_SHIPMENT' ? (
                <>
                  <strong>Lưu ý:</strong> Đơn hàng đang ở trạng thái <strong>Chờ lấy hàng</strong>. 
                  Yêu cầu hủy đơn sẽ được gửi đến cửa hàng để xem xét. Cửa hàng sẽ quyết định có chấp nhận yêu cầu hủy hay không.
                </>
              ) : (
                <>
                  <strong>Lưu ý:</strong> Chỉ có thể hủy khi trạng thái đơn là <strong>PENDING</strong>.
                </>
              )}
            </p>
          </div>
          
          <div>
            <p className="font-semibold mb-2 text-base">Lý do hủy</p>
            <Select
              value={cancelReason}
              onChange={setCancelReason}
              className="w-full"
              size="large"
              style={{ borderRadius: '8px' }}
            >
              <Option value="CHANGE_OF_MIND">Đổi ý</Option>
              <Option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</Option>
              <Option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</Option>
              <Option value="ORDERED_BY_ACCIDENT">Đặt nhầm</Option>
              <Option value="OTHER">Khác</Option>
            </Select>
          </div>
          
          <div>
            <p className="font-semibold mb-2 text-base">Ghi chú</p>
            <TextArea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder="VD: Đặt nhầm phiên bản, muốn đổi sang sản phẩm khác..."
              rows={4}
              style={{ borderRadius: '8px' }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Ghi chú sẽ được gửi kèm yêu cầu hủy đơn hàng.
            </p>
          </div>
        </Space>
      </Modal>
      <ReturnRequestModal
        open={showReturnModal}
        order={order}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => {
          onOrderCancelled?.();
          setShowReturnModal(false);
        }}
      />
    </div>
  );
};

export default OrderDetailModal;