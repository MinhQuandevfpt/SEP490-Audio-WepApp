import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startTransition } from 'react';
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
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Clock,
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

// Helper function to translate cancel reason to Vietnamese
const translateCancelReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    'FOUND_BETTER_PRICE': 'Tìm thấy giá tốt hơn',
    'CHANGE_OF_MIND': 'Đổi ý',
    'WRONG_ITEM': 'Sai sản phẩm',
    'DELIVERY_ISSUE': 'Vấn đề giao hàng',
    'WRONG_INFO_OR_ADDRESS': 'Sai thông tin/địa chỉ',
    'ORDERED_BY_ACCIDENT': 'Đặt nhầm',
    'OTHER': 'Khác',
  };
  return reasonMap[reason] || reason;
};

// Helper function to translate cancel request status to Vietnamese
const translateCancelRequestStatus = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    'REQUESTED': { label: 'Đang chờ xử lý', color: 'orange' },
    'APPROVED': { label: 'Đã chấp nhận', color: 'green' },
    'REJECTED': { label: 'Đã từ chối', color: 'red' },
  };
  return statusMap[status] || { label: status, color: 'default' };
};

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
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
  const [showCancelShippingModal, setShowCancelShippingModal] = useState(false);
  const [isCancellingShipping, setIsCancellingShipping] = useState(false);
  const [copiedGhnCode, setCopiedGhnCode] = useState<string | null>(null);
  
  // Cancel requests data
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [loadingCancelRequests, setLoadingCancelRequests] = useState(false);
  
  // GHN order data
  const [ghnOrderData, setGhnOrderData] = useState<Record<string, any>>({});
  
  const cancelRequestsRef = useRef<any[]>([]);
  const isTabVisibleRef = useRef(true);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Load GHN order data for each storeOrder
  useEffect(() => {
    if (!order) return;
    const storeOrders = Array.isArray(order.storeOrders) ? order.storeOrders : [];
    if (storeOrders.length === 0) return;

    const loadGhnData = async () => {
      const ghnDataTasks: Array<{ storeOrderId: string }> = [];
      storeOrders.forEach((storeOrder) => {
        if (!storeOrder.id || storeOrder.id.includes('-store-')) {
          return;
        }
        if (!ghnOrderData[storeOrder.id]) {
          ghnDataTasks.push({ storeOrderId: storeOrder.id });
        }
      });

      if (ghnDataTasks.length > 0) {
        const ghnUpdates: Record<string, any> = {};
        for (const task of ghnDataTasks) {
          try {
            const ghnOrder = await OrderHistoryService.getGhnOrderByStoreOrderId(task.storeOrderId);
            if (ghnOrder && ghnOrder.data) {
              ghnUpdates[task.storeOrderId] = ghnOrder.data;
            }
          } catch (error) {
            console.error(`Failed to load GHN order for ${task.storeOrderId}:`, error);
          }
          // Delay 400ms giữa mỗi API call
          if (ghnDataTasks.indexOf(task) < ghnDataTasks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
        
        if (Object.keys(ghnUpdates).length > 0) {
          startTransition(() => {
            setGhnOrderData((prev) => ({
              ...prev,
              ...ghnUpdates,
            }));
          });
        }
      }
    };

    void loadGhnData();
  }, [order, ghnOrderData]);

  // Tab visibility detection - chỉ poll khi tab active
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (!document.hidden) {
        // Tab active lại → fetch ngay
        loadCancelRequestsSilent();
        startCancelRequestsPolling();
      } else {
        // Tab inactive → pause polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load cancel requests (silent - không set loading state)
  const loadCancelRequestsSilent = useCallback(async () => {
    if (!isTabVisibleRef.current || !order) return;

    try {
      const requests = await OrderHistoryService.getCancelRequests(order.id);
      
      // So sánh với data cũ để detect changes
      const hasChanged = JSON.stringify(requests) !== JSON.stringify(cancelRequestsRef.current);
      
      if (hasChanged) {
        // Sử dụng startTransition để không block UI
        startTransition(() => {
          setCancelRequests(requests);
          cancelRequestsRef.current = requests;
        });
      }
    } catch (error) {
      // Silently fail - không update state để tránh mất data hiện tại
      console.error('Failed to load cancel requests:', error);
    }
  }, [order]);

  // Smart polling cho cancel requests
  const startCancelRequestsPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    if (!isTabVisibleRef.current || !order) return;

    // Kiểm tra xem có cần tiếp tục poll không
    // Nếu order đã completed/cancelled → tăng interval lên 30s
    // Nếu order đang active → giữ interval 10s
    const isOrderActive = order.status !== 'COMPLETED' && 
                          order.status !== 'CANCELLED' && 
                          order.status !== 'RETURNED';
    const interval = isOrderActive ? 10000 : 30000;

    pollingIntervalRef.current = setInterval(() => {
      if (isTabVisibleRef.current) {
        loadCancelRequestsSilent();
      }
    }, interval);
  }, [order, loadCancelRequestsSilent]);

  // Initial load với loading state
  useEffect(() => {
    if (!order) return;

    const loadCancelRequestsWithLoading = async () => {
      try {
        setLoadingCancelRequests(true);
        const requests = await OrderHistoryService.getCancelRequests(order.id);
        startTransition(() => {
          setCancelRequests(requests);
          cancelRequestsRef.current = requests;
        });
      } catch (error) {
        console.error('Failed to load cancel requests:', error);
        startTransition(() => {
          setCancelRequests([]);
          cancelRequestsRef.current = [];
        });
      } finally {
        setLoadingCancelRequests(false);
      }
    };

    loadCancelRequestsWithLoading();
    
    // Start polling sau khi load xong
    startCancelRequestsPolling();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [order, startCancelRequestsPolling]);

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
        // Reload cancel requests after sending request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
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
      const errorMessage = getErrorMessage(err, 'Hủy đơn hàng thất bại');
      // Check if error is about duplicate request (status 400 in response body or HTTP status)
      if (err?.status === 400 || err?.data?.status === 400) {
        // Show warning instead of error for duplicate requests
        message.warning(errorMessage, 5);
        // Reload cancel requests to show existing request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
        // Don't close modal on duplicate request so user can see the message
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelShipping = async () => {
    if (!order) return;
    try {
      setIsCancellingShipping(true);
      await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
      message.success('Yêu cầu hủy giao hàng đã được gửi đến cửa hàng.');
      // Reload cancel requests after sending request
      try {
        const requests = await OrderHistoryService.getCancelRequests(order.id);
        startTransition(() => {
          setCancelRequests(requests);
          cancelRequestsRef.current = requests;
        });
      } catch (error) {
        console.error('Failed to reload cancel requests:', error);
      }
      setShowCancelShippingModal(false);
      setCancelReason('CHANGE_OF_MIND');
      setCancelNote('');
      // Reload order data
      const orderData = await OrderHistoryService.getById(order.id);
      if (orderData) {
        setOrder(orderData);
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Không thể gửi yêu cầu hủy giao hàng');
      // Check if error is about duplicate request (status 400 in response body or HTTP status)
      if (err?.status === 400 || err?.data?.status === 400) {
        // Show warning instead of error for duplicate requests
        message.warning(errorMessage, 5);
        // Reload cancel requests to show existing request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
        // Don't close modal on duplicate request so user can see the message
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsCancellingShipping(false);
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

  const handleConfirmReceived = async () => {
    if (!order) return;
    
    try {
      setIsConfirmingReceived(true);
      await OrderHistoryService.confirmReceived(order.id);
      message.success('Xác nhận đã nhận hàng thành công');
      
      // Reload order data to get updated status
      const orderData = await OrderHistoryService.getById(order.id);
      if (orderData) {
        setOrder(orderData);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setIsConfirmingReceived(false);
    }
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
  const isAwaitingShipment = order.status === 'AWAITING_SHIPMENT';
  
  // Kiểm tra xem có GHN code không
  const hasGhnCode = storeOrders.some(storeOrder => ghnOrderData[storeOrder.id]?.orderGhn);
  
  // Kiểm tra điều kiện hiển thị button "Yêu cầu hủy giao hàng"
  const canCancelShipping = isAwaitingShipment && hasGhnCode;

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

                        {/* GHN Shipping Information */}
                        {ghnOrderData[storeOrder.id]?.orderGhn && (
                          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
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
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Cancel Requests Section */}
            {cancelRequests.length > 0 && (
              <Card
                title={
                  <Space>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>Yêu cầu hủy đơn hàng</span>
                    <Tag color="red">
                      {cancelRequests.length} yêu cầu
                    </Tag>
                  </Space>
                }
                className="border-gray-200 shadow-sm"
                style={{ borderRadius: 12 }}
              >
                {loadingCancelRequests ? (
                  <div className="flex items-center justify-center py-4">
                    <Spin size="small" />
                    <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cancelRequests.map((request: any, index: number) => {
                      const statusInfo = translateCancelRequestStatus(request.status);
                      return (
                        <div
                          key={request.id}
                          className="rounded-lg border border-red-200 bg-white p-3 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-gray-700">
                                Yêu cầu #{index + 1}
                              </span>
                              <Tag color={statusInfo.color} className="text-xs">
                                {statusInfo.label}
                              </Tag>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-gray-500">Lý do hủy:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {translateCancelReason(request.reason)}
                              </span>
                            </div>
                            {request.note && (
                              <div>
                                <span className="text-gray-500">Ghi chú:</span>
                                <span className="ml-1 text-gray-700 break-words">
                                  {request.note}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Yêu cầu lúc:</span>
                              <span className="font-medium text-gray-700 whitespace-nowrap">
                                {new Date(request.requestedAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            {request.processedAt && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <span>Xử lý lúc:</span>
                                <span className="font-medium text-gray-700 whitespace-nowrap">
                                  {new Date(request.processedAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <Descriptions.Item label="Giá gốc (chưa giảm giá)">
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
                  <>
                    <Button
                      type="primary"
                      className="h-10 w-full"
                      style={{ backgroundColor: '#27AE60', borderColor: '#27AE60', borderRadius: '10px' }}
                      onClick={handleConfirmReceived}
                      loading={isConfirmingReceived}
                    >
                      Đã nhận hàng
                    </Button>
                    <Button
                      className="h-10 w-full"
                      style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                      onClick={() => setShowReturnModal(true)}
                    >
                      Hoàn trả sản phẩm
                    </Button>
                  </>
                )}
                {canCancelShipping && (
                  <Button 
                    danger 
                    className="h-10 w-full" 
                    style={{ borderRadius: '10px' }} 
                    onClick={() => {
                      message.warning('Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.', 5);
                      setShowCancelShippingModal(true);
                    }}
                  >
                    Yêu cầu hủy giao hàng
                  </Button>
                )}
                {canCancelOrder(order.status) && !canCancelShipping && (
                  <Button 
                    danger 
                    className="h-10 w-full" 
                    style={{ borderRadius: '10px' }} 
                    onClick={() => {
                      message.warning('Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.', 5);
                      setShowCancelModal(true);
                    }}
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
            
            {/* Cảnh báo về điểm uy tín */}
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">
                ⚠️ Cảnh báo về điểm uy tín
              </p>
              <p className="mt-2 text-sm text-orange-700">
                Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.
              </p>
            </div>

            <p className="mt-4 text-sm text-gray-600">
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

      {/* Cancel Shipping Modal with Reputation Warning */}
      {showCancelShippingModal && order && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isCancellingShipping && setShowCancelShippingModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">
              Yêu cầu hủy giao hàng
            </h3>
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">
                ⚠️ Cảnh báo về điểm uy tín
              </p>
              <p className="mt-2 text-sm text-orange-700">
                Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.
              </p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Bạn có chắc chắn muốn gửi yêu cầu hủy giao hàng này không?
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
                  if (!isCancellingShipping) {
                    setShowCancelShippingModal(false);
                    setCancelReason('CHANGE_OF_MIND');
                    setCancelNote('');
                  }
                }}
                disabled={isCancellingShipping}
              >
                Hủy
              </Button>
              <Button 
                danger 
                className="flex-1" 
                loading={isCancellingShipping} 
                onClick={handleCancelShipping}
              >
                Xác nhận gửi yêu cầu
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

