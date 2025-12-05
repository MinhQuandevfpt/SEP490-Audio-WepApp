import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Spin,
  Typography,
  Breadcrumb,
  Space,
  Descriptions,
  Tag,
  Divider,
  Button,
  Row,
  Col,
  Image,
  Select,
  Input,
  message,
} from 'antd';
import {
  Home,
  Package,
  Calendar,
  MapPin,
  Phone,
  Receipt,
  Store,
  ArrowLeft,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import Layout from '../../../components/Layout';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import type { CustomerOrder } from '../../../types/api';
import {
  getStatusLabel,
  getStatusBadgeStyle,
  formatCurrency,
  formatDate,
  canCancelOrder,
} from '../../../utils/orderStatus';
import ReturnRequestModal from '../../../components/OrderHistoryComponents/ReturnRequestModal';

const { Option } = Select;
const { TextArea } = Input;

const { Title, Text } = Typography;

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orderData = await OrderHistoryService.getById(orderId);
        if (orderData) {
          setOrder(orderData);
        } else {
          setError('Không tìm thấy đơn hàng');
        }
      } catch (err: any) {
        console.error('Error loading order detail:', err);
        setError(err?.message || 'Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [orderId]);

  const resolveOrderItemImage = (item: {
    image?: string | null;
    variantId?: string | null;
    variantUrl?: string | null;
  }) => {
    if (item.variantId) {
      return item.variantUrl || item.image || undefined;
    }
    return item.image || item.variantUrl || undefined;
  };

  const formatVariantLabel = (item: {
    variantOptionName?: string | null;
    variantOptionValue?: string | null;
  }) => {
    if (!item.variantOptionName || !item.variantOptionValue) return null;
    return `${item.variantOptionName}: ${item.variantOptionValue}`;
  };

  const getErrorMessage = (error: any, fallback: string) => {
    return (
      error?.message ||
      error?.data?.message ||
      (Array.isArray(error?.errors) ? error.errors[0] : null) ||
      fallback
    );
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setIsCancelling(true);
      if (order.status === 'AWAITING_SHIPMENT') {
        await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
        message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng.');
      } else {
        await OrderHistoryService.cancel(order.id, cancelReason, cancelNote);
        message.success('Hủy đơn hàng thành công');
      }
      setShowCancelModal(false);
      setCancelReason('CHANGE_OF_MIND');
      setCancelNote('');
      // Reload order data
      const orderData = await OrderHistoryService.getById(order.id);
      if (orderData) {
        setOrder(orderData);
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, 'Hủy đơn hàng thất bại'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnSuccess = () => {
    // Reload order data after return request
    if (orderId) {
      OrderHistoryService.getById(orderId).then((orderData) => {
        if (orderData) {
          setOrder(orderData);
        }
      });
    }
    setShowReturnModal(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card>
              <div className="py-16 text-center">
                <Spin size="large" style={{ color: '#FF6A00' }} />
                <p className="mt-4 text-gray-500 text-base">Đang tải chi tiết đơn hàng...</p>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card>
              <div className="py-8 text-center">
                <Text type="danger" className="text-base">{error || 'Không tìm thấy đơn hàng'}</Text>
                <div className="mt-4">
                  <Button onClick={() => navigate('/orders')}>Quay lại danh sách đơn hàng</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const statusStyle = getStatusBadgeStyle(order.status);
  const storeOrders = Array.isArray(order.storeOrders) ? order.storeOrders : [];
  const rootItems = Array.isArray((order as any).items) ? (order as any).items : [];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            className="mb-6"
            items={[
              {
                title: (
                  <Space>
                    <Home className="w-4 h-4" />
                    <span>Tài khoản</span>
                  </Space>
                ),
              },
              {
                title: (
                  <button onClick={() => navigate('/orders')} className="text-blue-600 hover:text-blue-800">
                    Đơn hàng của tôi
                  </button>
                ),
              },
              { title: 'Chi tiết đơn hàng' },
            ]}
            style={{ fontSize: '14px' }}
          />

          <div className="mb-4">
            <Button
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/orders')}
              style={{ marginBottom: '16px' }}
            >
              Quay lại
            </Button>
          </div>

          <div className="space-y-6">
            {/* Order Header */}
            <Card
              className="border-gray-200 shadow-sm"
              style={{
                borderRadius: 12,
                borderTop: '3px solid #FF6A00',
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <Title level={2} className="!mb-2 !text-gray-900">
                    Chi tiết đơn hàng
                  </Title>
                  <Space size="middle">
                    <Text strong>Mã đơn:</Text>
                    <Text className="text-lg font-mono">{order.orderCode || order.id}</Text>
                    {order.externalOrderCode && (
                      <>
                        <Divider type="vertical" />
                        <Text strong>Mã thanh toán:</Text>
                        <Text className="text-lg font-mono">{order.externalOrderCode}</Text>
                      </>
                    )}
                  </Space>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <Tag style={statusStyle} className="text-base px-4 py-1">
                    {getStatusLabel(order.status)}
                  </Tag>
                  <Text type="secondary" className="text-sm">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(order.createdAt)}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card
              title={
                <Space>
                  <MapPin className="w-5 h-5 text-[#FF6A00]" />
                  <span>Địa chỉ giao hàng</span>
                </Space>
              }
              className="border-gray-200 shadow-sm"
              style={{ borderRadius: 12 }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Người nhận">
                  <Space>
                    <Phone className="w-4 h-4" />
                    <Text strong>{order.receiverName}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <Text>{order.phoneNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ chi tiết" span={2}>
                  <Text>{order.addressLine}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Đường/Phố">
                  <Text>{order.street}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phường/Xã">
                  <Text>{order.ward}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Quận/Huyện">
                  <Text>{order.district}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tỉnh/Thành phố">
                  <Text>{order.province}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Quốc gia">
                  <Text>{order.country || 'Việt Nam'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã bưu điện">
                  <Text>{order.postalCode || 'N/A'}</Text>
                </Descriptions.Item>
                {order.note && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    <Text>{order.note}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Store Orders */}
            {storeOrders.length > 0 && (
              <Card
                title={
                  <Space>
                    <Store className="w-5 h-5 text-[#FF6A00]" />
                    <span>Đơn hàng cửa hàng ({storeOrders.length})</span>
                  </Space>
                }
                className="border-gray-200 shadow-sm"
                style={{ borderRadius: 12 }}
              >
                <div className="space-y-6">
                  {storeOrders.map((storeOrder) => {
                    const itemsForStoreOrder = rootItems.filter(
                      (item: any) => item.storeOrderId === storeOrder.id
                    );
                    const storeOrderWithExtras = storeOrder as any;

                    return (
                      <Card
                        key={storeOrder.id}
                        className="border-gray-100"
                        style={{ borderRadius: 8 }}
                        title={
                          <Space>
                            <Text strong>{storeOrder.storeName}</Text>
                            <Tag style={getStatusBadgeStyle(storeOrder.status)}>
                              {getStatusLabel(storeOrder.status)}
                            </Tag>
                          </Space>
                        }
                      >
                        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small" className="mb-4">
                          <Descriptions.Item label="Mã đơn cửa hàng">
                            <Text code>{storeOrder.orderCode || 'N/A'}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Ngày tạo">
                            {formatDate(storeOrder.createdAt)}
                          </Descriptions.Item>
                          {storeOrderWithExtras.deliveredAt && (
                            <Descriptions.Item label="Ngày giao">
                              {formatDate(storeOrderWithExtras.deliveredAt)}
                            </Descriptions.Item>
                          )}
                          <Descriptions.Item label="Tổng tiền hàng">
                            <Text strong>{formatCurrency(storeOrder.totalAmount)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Giảm giá">
                            <Text type="success">-{formatCurrency(storeOrder.discountTotal)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Phí vận chuyển">
                            <Text>{formatCurrency(storeOrder.shippingFee)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Phí vận chuyển thực tế">
                            <Text>{formatCurrency((storeOrder as any).shippingFeeReal || 0)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Phí vận chuyển cho cửa hàng">
                            <Text>{formatCurrency((storeOrder as any).shippingFeeForStore || 0)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Giảm giá voucher cửa hàng">
                            <Text type="success">
                              -{formatCurrency((storeOrder as any).storeVoucherDiscount || 0)}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Giảm giá voucher nền tảng">
                            <Text type="success">
                              -{formatCurrency((storeOrder as any).platformVoucherDiscount || 0)}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Tổng cộng" span={3}>
                            <Text strong className="text-lg text-[#FF6A00]">
                              {formatCurrency(storeOrder.grandTotal)}
                            </Text>
                          </Descriptions.Item>
                          {(storeOrder as any).storeVoucherDetailJson &&
                            (storeOrder as any).storeVoucherDetailJson !== '{}' && (
                              <Descriptions.Item label="Chi tiết voucher cửa hàng" span={3}>
                                <Text code className="text-xs">
                                  {(storeOrder as any).storeVoucherDetailJson}
                                </Text>
                              </Descriptions.Item>
                            )}
                          {(storeOrder as any).platformVoucherDetailJson &&
                            (storeOrder as any).platformVoucherDetailJson !== '{}' && (
                              <Descriptions.Item label="Chi tiết voucher nền tảng" span={3}>
                                <Text code className="text-xs">
                                  {(storeOrder as any).platformVoucherDetailJson}
                                </Text>
                              </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Items in this store order */}
                        {itemsForStoreOrder.length > 0 && (
                          <div className="mt-4">
                            <Divider orientation="left">
                              <Text strong>Sản phẩm ({itemsForStoreOrder.length})</Text>
                            </Divider>
                            <div className="space-y-3">
                              {itemsForStoreOrder.map((item: any) => {
                                const itemImage = resolveOrderItemImage(item);
                                return (
                                  <Card
                                    key={item.id}
                                    size="small"
                                    className="border-gray-100"
                                    style={{ borderRadius: 8 }}
                                  >
                                    <Row gutter={16} align="middle">
                                      <Col xs={24} sm={4}>
                                        {itemImage ? (
                                          <Image
                                            src={itemImage}
                                            alt={item.name}
                                            width={80}
                                            height={80}
                                            style={{ objectFit: 'cover', borderRadius: 8 }}
                                            preview={false}
                                          />
                                        ) : (
                                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                          </div>
                                        )}
                                      </Col>
                                      <Col xs={24} sm={20}>
                                        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
                                          <Descriptions.Item label="Tên sản phẩm" span={3}>
                                            <Text strong>{item.name}</Text>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Loại">
                                            <Tag>{item.type === 'PRODUCT' ? 'Sản phẩm' : 'Combo'}</Tag>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Số lượng">
                                            <Text strong>{item.quantity}</Text>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Đơn giá">
                                            <Text>{formatCurrency(item.unitPrice)}</Text>
                                          </Descriptions.Item>
                                          {formatVariantLabel(item) && (
                                            <Descriptions.Item label="Biến thể" span={2}>
                                              <Text>{formatVariantLabel(item)}</Text>
                                            </Descriptions.Item>
                                          )}
                                        </Descriptions>
                                      </Col>
                                    </Row>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Root Items (if not mapped to storeOrders) */}
            {rootItems.length > 0 && storeOrders.length === 0 && (
              <Card
                title={
                  <Space>
                    <ShoppingBag className="w-5 h-5 text-[#FF6A00]" />
                    <span>Sản phẩm ({rootItems.length})</span>
                  </Space>
                }
                className="border-gray-200 shadow-sm"
                style={{ borderRadius: 12 }}
              >
                <div className="space-y-3">
                  {rootItems.map((item: any) => {
                    const itemImage = resolveOrderItemImage(item);
                    return (
                      <Card key={item.id} size="small" className="border-gray-100" style={{ borderRadius: 8 }}>
                        <Row gutter={16} align="middle">
                          <Col xs={24} sm={4}>
                            {itemImage ? (
                              <Image
                                src={itemImage}
                                alt={item.name}
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover', borderRadius: 8 }}
                                preview={false}
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </Col>
                          <Col xs={24} sm={20}>
                            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
                              <Descriptions.Item label="Tên sản phẩm" span={3}>
                                <Text strong>{item.name}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label="ID">{item.id}</Descriptions.Item>
                              <Descriptions.Item label="ID tham chiếu">{item.refId}</Descriptions.Item>
                              <Descriptions.Item label="Loại">
                                <Tag>{item.type === 'PRODUCT' ? 'Sản phẩm' : 'Combo'}</Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="Số lượng">{item.quantity}</Descriptions.Item>
                              <Descriptions.Item label="Đơn giá">{formatCurrency(item.unitPrice)}</Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Order Summary */}
            <Card
              title={
                <Space>
                  <Receipt className="w-5 h-5 text-[#FF6A00]" />
                  <span>Tóm tắt đơn hàng</span>
                </Space>
              }
              className="border-gray-200 shadow-sm"
              style={{ borderRadius: 12 }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Tạm tính">
                  <Text>{formatCurrency(order.totalAmount)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Giảm giá">
                  <Text type="success">-{formatCurrency(order.discountTotal)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phí vận chuyển">
                  <Text>{formatCurrency(order.shippingFeeTotal)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng cộng">
                  <Text strong className="text-xl text-[#FF6A00]">
                    {formatCurrency(order.grandTotal)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Actions */}
            <Card
              title={
                <Space>
                  <Receipt className="w-5 h-5 text-[#FF6A00]" />
                  <span>Thao tác</span>
                </Space>
              }
              className="border-gray-200 shadow-sm"
              style={{ borderRadius: 12 }}
            >
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
                {order.status === 'DELIVERY_SUCCESS' && (
                  <Button
                    className="h-10 w-full"
                    style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                    onClick={() => setShowReturnModal(true)}
                  >
                    Hoàn trả sản phẩm
                  </Button>
                )}
                {canCancelOrder(order.status) && (
                  <Button 
                    danger 
                    className="h-10 w-full" 
                    style={{ borderRadius: '10px' }} 
                    onClick={() => setShowCancelModal(true)}
                  >
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
                {order.status === 'RETURN_REQUESTED' && (
                  <Button
                    className="h-10 w-full"
                    style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                    onClick={() => navigate(`/returns`)}
                  >
                    Xem trạng thái hoàn trả
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && order && (
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

            {/* Lý do hủy */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Lý do hủy</p>
              <Select
                value={cancelReason}
                onChange={setCancelReason}
                className="w-full"
                size="large"
                style={{ borderRadius: 8 }}
              >
                <Option value="CHANGE_OF_MIND">Đổi ý</Option>
                <Option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</Option>
                <Option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</Option>
                <Option value="ORDERED_BY_ACCIDENT">Đặt nhầm</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </div>

            {/* Ghi chú */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Ghi chú</p>
              <TextArea
                rows={3}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="VD: Đặt nhầm phiên bản, muốn đổi sang sản phẩm khác..."
                style={{ borderRadius: 8 }}
              />
            </div>

            <div className="mt-6 flex gap-3">
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
              <Button danger className="flex-1" loading={isCancelling} onClick={handleCancelOrder}>
                {order.status === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {order && (
        <ReturnRequestModal
          open={showReturnModal}
          order={order}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </Layout>
  );
};

export default OrderDetailPage;

