import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Spin, Typography, Card, Modal, Select, Input, message } from 'antd';
import { ArrowRight, Package, Calendar, Receipt } from 'lucide-react';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import { getStatusLabel, getStatusBadgeStyle, formatCurrency, formatDate, canCancelOrder } from '../../../utils/orderStatus';

const { TextArea } = Input;
const { Option } = Select;

const { Text, Title } = Typography;

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadRecentOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await OrderHistoryService.list({ page: 0, size: 1 });
      setOrders(response.data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load recent orders (1 most recent)
  useEffect(() => {
    loadRecentOrders();
  }, [loadRecentOrders]);

  const handleViewAll = () => {
    navigate('/orders');
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCancelOrder = async () => {
    if (orders.length === 0) return;
    const order = orders[0];
    try {
      setIsCancelling(true);
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
      loadRecentOrders(); // Reload orders
    } catch (err: any) {
      message.error(err?.message || 'Hủy đơn hàng thất bại');
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper function để lấy hình ảnh sản phẩm
  const resolveOrderItemImage = (item: any) => {
    if (item?.variantId) {
      return item.variantUrl || item.image || undefined;
    }
    return item?.image || item?.variantUrl || undefined;
  };

  // Tính tổng số sản phẩm và lấy tên sản phẩm đầu tiên
  const orderSummary = useMemo(() => {
    if (orders.length === 0) return null;
    const order = orders[0];
    const storeOrders = order.storeOrders ?? [];
    const allItems = storeOrders.flatMap(so => so.items ?? []);
    const totalItems = allItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const firstItem = allItems[0];
    
    return {
      totalItems,
      firstProductName: firstItem?.name || 'Sản phẩm',
      firstProductImage: resolveOrderItemImage(firstItem),
      displayOrderCode: order.orderCode ?? 'N/A',
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      discountTotal: order.discountTotal,
      shippingFeeTotal: order.shippingFeeTotal,
      grandTotal: order.grandTotal,
      orderId: order.id,
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Title level={4} className="!mb-1 !text-gray-900">Đơn hàng gần đây</Title>
        <Text type="secondary" className="text-sm">Đơn hàng mới nhất của bạn</Text>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" style={{ color: '#f97316' }} />
          <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <Text type="danger" className="text-base">{error}</Text>
        </div>
      ) : orders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p className="text-gray-600 font-medium mb-1">Bạn chưa có đơn hàng nào</p>
              <p className="text-sm text-gray-400">Hãy bắt đầu mua sắm ngay!</p>
            </div>
          }
        />
      ) : orderSummary ? (
        <div className="space-y-4">
          <Card
            className="shadow-sm border-gray-200 hover:shadow-md transition-shadow"
            styles={{ body: { padding: '20px' } }}
          >
            <div className="space-y-4">
              {/* Header: Mã đơn và Trạng thái */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <div>
                    <Text type="secondary" className="text-xs uppercase tracking-wide">Mã đơn</Text>
                    <div className="font-semibold text-gray-900">{orderSummary.displayOrderCode}</div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <span style={getStatusBadgeStyle(orderSummary.status)}>
                    {getStatusLabel(orderSummary.status)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(orderSummary.createdAt)}
                  </div>
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-start gap-3">
                  {/* Hình ảnh sản phẩm */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {orderSummary.firstProductImage ? (
                      <img 
                        src={orderSummary.firstProductImage} 
                        alt={orderSummary.firstProductName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-full w-full p-3 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Thông tin sản phẩm và giá */}
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-gray-900 block">
                      {orderSummary.firstProductName}
                    </Text>
                    {orderSummary.totalItems > 1 && (
                      <Text type="secondary" className="text-xs block mt-1">
                        và {orderSummary.totalItems - 1} sản phẩm khác
                      </Text>
                    )}
                  </div>
                </div>
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <Text className="text-sm font-semibold text-gray-900">Tóm tắt đơn hàng</Text>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Text type="secondary">Tạm tính:</Text>
                    <Text>{formatCurrency(orderSummary.totalAmount - orderSummary.discountTotal)}</Text>
                  </div>
                  <div className="flex justify-between text-sm">
                    <Text type="secondary">Phí vận chuyển:</Text>
                    <Text>{formatCurrency(orderSummary.shippingFeeTotal)}</Text>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <Text className="font-semibold text-gray-900">Tổng cộng:</Text>
                    <Text className="font-semibold text-orange-600 text-base">
                      {formatCurrency(orderSummary.grandTotal)}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Thao tác */}
              <div className="border-t border-gray-100 pt-4">
                <Text className="text-sm font-semibold text-gray-900 block mb-3">Thao tác</Text>
                <div className="space-y-2">
                  {canCancelOrder(orderSummary.status) && (
                    <Button
                      danger
                      block
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
                      {orderSummary.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                    </Button>
                  )}
                  {orderSummary.status === 'DELIVERY_SUCCESS' && (
                    <Button
                      block
                      onClick={() => navigate('/returns')}
                      style={{
                        borderColor: '#f97316',
                        color: '#f97316',
                        borderRadius: '8px',
                        height: '40px'
                      }}
                    >
                      Hoàn trả sản phẩm
                    </Button>
                  )}
                  {orderSummary.status === 'UNPAID' && (
                    <Button
                      type="primary"
                      block
                      onClick={() => handleViewDetail(orderSummary.orderId)}
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
          </Card>

          <Button
            type="primary"
            block
            size="large"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleViewAll}
            style={{ 
              backgroundColor: '#f97316', 
              borderColor: '#f97316',
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
          Xem tất cả đơn hàng
          </Button>
        </div>
      ) : null}

      {/* Cancel Order Modal */}
      {orderSummary && (
        <Modal
          title={orderSummary.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
          open={showCancelModal}
          onCancel={() => {
            if (!isCancelling) {
              setShowCancelModal(false);
              setCancelReason('CHANGE_OF_MIND');
              setCancelNote('');
            }
          }}
          footer={null}
          width={500}
        >
          <div className="space-y-4">
            <div>
              <Text className="text-sm font-medium text-gray-700 block mb-2">Lý do hủy đơn</Text>
              <Select
                value={cancelReason}
                onChange={setCancelReason}
                className="w-full"
                style={{ borderRadius: '8px' }}
              >
                <Option value="CHANGE_OF_MIND">Thay đổi ý định</Option>
                <Option value="FOUND_BETTER_PRICE">Tìm thấy giá tốt hơn</Option>
                <Option value="WRONG_ORDER">Đặt nhầm đơn hàng</Option>
                <Option value="OUT_OF_STOCK">Hết hàng</Option>
                <Option value="DELIVERY_TOO_LONG">Thời gian giao hàng quá lâu</Option>
                <Option value="OTHER">Lý do khác</Option>
              </Select>
            </div>

            <div>
              <Text className="text-sm font-medium text-gray-700 block mb-2">Ghi chú</Text>
              <TextArea
                rows={3}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="VD: Đặt nhầm phiên bản, muốn đổi sang sản phẩm khác..."
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (!isCancelling) {
                    setShowCancelModal(false);
                    setCancelReason('CHANGE_OF_MIND');
                    setCancelNote('');
                  }
                }}
                disabled={isCancelling}
              >
                Đóng
              </Button>
              <Button
                danger
                className="flex-1"
                loading={isCancelling}
                onClick={handleCancelOrder}
              >
                {orderSummary.status === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderHistory;


