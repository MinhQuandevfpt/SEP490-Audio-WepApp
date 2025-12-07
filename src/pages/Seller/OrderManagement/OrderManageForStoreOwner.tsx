import React, { useState } from 'react';
import { Table, Tag, Typography, Descriptions, List, Divider, Empty, Button, Modal, Input, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Package, PackageCheck, Truck, Trash2, Printer, Calendar, DollarSign, XCircle, AlertCircle, Clock, Check, X } from 'lucide-react';
import { StoreOrderFilter, GhnTransferModal } from '../../../components/StoreOwnerOrderManagementComponents';
import useStoreOrders from '../../../hooks/useStoreOrders';
import type { StoreOrder } from '../../../types/seller';
import { formatCurrency, getStatusLabel } from '../../../utils/orderStatus';
import { StoreOrderService } from '../../../services/seller/OrderService';
import { GhnService } from '../../../services/seller/GhnService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const { Text } = Typography;

// Helper function to mask address/name: "2 ký tự đầu ... 2 ký tự cuối"
const maskAddress = (value: string | undefined | null): string => {
  if (!value || value.trim() === '') return '';
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    // If too short, just show first char + dots
    return trimmed[0] + '...';
  }
  // Show first 2 chars + dots + last 2 chars
  return trimmed.substring(0, 2) + '...' + trimmed.substring(trimmed.length - 2);
};

// Helper function to mask customer info: random 2-3 ký tự đầu hoặc cuối, còn lại là dấu chấm
const maskCustomerInfo = (value: string | undefined | null): string => {
  if (!value || value.trim() === '') return '-';
  const trimmed = value.trim();
  
  if (trimmed.length <= 3) {
    // If too short, show first char + dots
    return trimmed[0] + '...';
  }
  
  // Use hash of value to make it consistent (same value always shows same pattern)
  // This ensures the same value always displays the same way
  const hash = trimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Random: 50% chance show đầu, 50% chance show cuối
  const showStart = hash % 2 === 0;
  
  // Random: 2 or 3 characters (based on hash, using different modulo)
  const charsToShow = (hash % 3) === 0 ? 3 : 2; // 2 or 3 characters
  
  if (showStart) {
    // Show 2-3 ký tự đầu + dots
    return trimmed.substring(0, charsToShow) + '...';
  } else {
    // Show dots + 2-3 ký tự cuối
    return '...' + trimmed.substring(trimmed.length - charsToShow);
  }
};

const OrderManageForStoreOwner: React.FC = () => {
  const {
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    orders,
    isLoading,
    error,
    total,
    refresh,
  } = useStoreOrders();

  const [preparingOrderId, setPreparingOrderId] = useState<string | null>(null);
  const [ghnTransferOrderId, setGhnTransferOrderId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderCode, setCancelOrderCode] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showPrintTokenModal, setShowPrintTokenModal] = useState(false);
  const [printTokenOrderCode, setPrintTokenOrderCode] = useState('');
  const [isGettingPrintToken, setIsGettingPrintToken] = useState(false);
  const [ghnOrderData, setGhnOrderData] = useState<Record<string, any>>({});
  const [loadingGhnOrders, setLoadingGhnOrders] = useState<Record<string, boolean>>({});
  const [cancelRequestsData, setCancelRequestsData] = useState<Record<string, any[]>>({});
  const [loadingCancelRequests, setLoadingCancelRequests] = useState<Record<string, boolean>>({});
  const [processingCancelRequest, setProcessingCancelRequest] = useState<Record<string, boolean>>({});
  const [showRejectModal, setShowRejectModal] = useState<{ orderId: string; requestId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const handlePrepareOrder = async (orderId: string) => {
    try {
      setPreparingOrderId(orderId);
      await StoreOrderService.updateOrderStatus(orderId, 'AWAITING_SHIPMENT');
      showCenterSuccess('Đơn hàng đã được chuyển sang trạng thái "Chờ lấy hàng"', 'Thành công');
      refresh();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể chuẩn bị đơn hàng', 'Lỗi');
    } finally {
      setPreparingOrderId(null);
    }
  };

  const handleGhnTransferSubmit = (data: any) => {
    console.log('GHN Transfer Data for order:', ghnTransferOrderId, data);
    // TODO: Gọi API khi đã sẵn sàng
    setGhnTransferOrderId(null);
    refresh(); // Refresh order list after GHN transfer
  };

  const handleCancelGhnOrder = async () => {
    if (!cancelOrderCode || !cancelOrderCode.trim()) {
      showCenterError('Vui lòng nhập mã đơn hàng GHN', 'Lỗi');
      return;
    }

    try {
      setIsCancelling(true);
      
      console.log('🔄 Cancelling GHN order:', cancelOrderCode);
      
      const response = await GhnService.cancelOrder([cancelOrderCode.trim()]);
      
      console.log('📦 GHN Cancel Order Response:', JSON.stringify(response, null, 2));
      console.log('📦 GHN Cancel Response Object:', response);
      
      showCenterSuccess('Hủy đơn hàng GHN thành công!', 'Thành công', 3000);
      
      // Reset cancel modal
      setShowCancelModal(false);
      setCancelOrderCode('');
      
      // Refresh order list
      refresh();
    } catch (error: any) {
      console.error('❌ Error cancelling GHN order:', error);
      showCenterError(
        error?.message || 'Không thể hủy đơn hàng GHN. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleGetPrintToken = async () => {
    if (!printTokenOrderCode || !printTokenOrderCode.trim()) {
      showCenterError('Vui lòng nhập mã đơn hàng GHN', 'Lỗi');
      return;
    }

    try {
      setIsGettingPrintToken(true);
      
      console.log('🖨️ Getting print token for GHN order:', printTokenOrderCode);
      
      const response = await GhnService.getPrintToken([printTokenOrderCode.trim()]);
      
      // Log response (for debugging only)
      console.log('📦 GHN Print Token Response:', JSON.stringify(response, null, 2));
      
      if (response.code === 200 && response.data && response.data.token) {
        // Auto-print invoice when token is successfully retrieved
        const token = response.data.token;
        
        // Close print token modal
        setShowPrintTokenModal(false);
        setPrintTokenOrderCode('');
        
        // Automatically open invoice modal and print
        await handlePrintInvoice(token);
        
        showCenterSuccess('Đang tải hóa đơn để in...', 'Thành công');
      } else {
        showCenterError(response.message || 'Không thể lấy print token', 'Lỗi');
      }
    } catch (error: any) {
      console.error('❌ Error getting print token:', error);
      showCenterError(
        error?.message || 'Không thể lấy print token. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsGettingPrintToken(false);
    }
  };

  const handlePrintInvoice = async (token: string) => {
    try {
      console.log('🖨️ Getting invoice HTML for token:', token);
      
      const html = await GhnService.getPrintA5(token);
      
      console.log('📄 Invoice HTML received, length:', html.length);
      
      // Create a new window with the invoice HTML and auto-print
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images to load, then auto-print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      }
      
      showCenterSuccess('Đã mở cửa sổ in hóa đơn', 'Thành công');
    } catch (error: any) {
      console.error('❌ Error getting invoice:', error);
      showCenterError(
        error?.message || 'Không thể lấy hóa đơn in. Vui lòng thử lại.',
        'Lỗi'
      );
    }
  };

  const columns: ColumnsType<StoreOrder> = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (orderCode: string) => <Text code>{orderCode || '-'}</Text>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (v: string, record) => (
        <div>
          <div className="font-medium text-gray-800">
            {maskAddress(v)}{/* 2 ký tự đầu ... 2 ký tự cuối */}
          </div>
          <div className="text-xs text-gray-500">
            {record.customerPhone ? maskAddress(record.customerPhone) : ''}
          </div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const label = getStatusLabel(status as any);
        const colorMap: Record<string, string> = {
          COMPLETED: 'green',
          CONFIRMED: 'blue',
          SHIPPING: 'purple',
          AWAITING_SHIPMENT: 'gold',
          GHN_CREATED: 'blue',
          UNPAID: 'orange',
          CANCELLED: 'red',
          RETURN_REQUESTED: 'orange',
          RETURNED: 'default',
          PENDING: 'default',
          READY_FOR_PICKUP: 'cyan',
          READY_FOR_DELIVERY: 'cyan',
          OUT_FOR_DELIVERY: 'processing',
          DELIVERED_WAITING_CONFIRM: 'gold',
          DELIVERY_SUCCESS: 'green',
          DELIVERY_DENIED: 'red',
          DELIVERY_FAIL: 'red',
          EXCEPTION: 'volcano',
        };
        return <Tag color={colorMap[status] || 'default'}>{label}</Tag>;
      }
    },
    {
      title: 'Tổng tiền',
      key: 'grandTotal',
      render: (_, r) => (
        <div>
          <div className="font-semibold text-gray-800">{formatCurrency(r.grandTotal)}</div>
          <div className="text-xs text-gray-500">SP: {r.items?.reduce((s, i) => s + i.quantity, 0) || 0}</div>
        </div>
      )
    },
    {
      title: 'Địa chỉ giao',
      key: 'shipAddress',
      render: (_, r) => {
        const addr = [r.shipStreet, r.shipWard, r.shipDistrict, r.shipProvince].filter(Boolean).join(', ');
        const receiverName = r.shipReceiverName || '';
        return (
          <div className="max-w-xs">
            <Tooltip title={receiverName} placement="top">
              <div className="font-medium text-gray-800 cursor-help">{maskAddress(receiverName)}</div>
            </Tooltip>
            <Tooltip title={addr} placement="top">
              <div className="text-xs text-gray-500 cursor-help">{maskAddress(addr)}</div>
            </Tooltip>
          </div>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        const isAwaitingShipment = record.status === 'AWAITING_SHIPMENT';
        const isPreparing = preparingOrderId === record.id;
        const hasGhnOrder = !!ghnOrderData[record.id];
        
        if (isPending) {
          return (
            <Button
              type="primary"
              icon={<PackageCheck className="w-4 h-4" />}
              onClick={() => handlePrepareOrder(record.id)}
              disabled={isPreparing}
              loading={isPreparing}
              size="small"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              title="Xác nhận lên đơn hàng"
            >
              {isPreparing ? 'Đang xử lý...' : 'Xác nhận lên đơn hàng'}
            </Button>
          );
        }
        
        // Chỉ cho phép "Chuyển nhượng GHN" khi đơn đang chờ lấy hàng
        // và CHƯA có thông tin vận chuyển GHN trong hệ thống
        if (isAwaitingShipment && !hasGhnOrder) {
          return (
            <Button
              type="primary"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => setGhnTransferOrderId(record.id)}
              size="small"
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              title="Chuyển nhượng GHN"
            >
              Chuyển nhượng GHN
            </Button>
          );
        }
        
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-1">Xem và quản lý tất cả đơn hàng của cửa hàng</p>
      </div>

      <StoreOrderFilter
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Action Buttons for GHN */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3">
        <Button
          danger
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => {
            setCancelOrderCode('');
            setShowCancelModal(true);
          }}
          size="middle"
          title="Hủy gọi vận chuyển GHN"
        >
          Hủy GHN
        </Button>
        <Button
          type="default"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => {
            setPrintTokenOrderCode('');
            setShowPrintTokenModal(true);
          }}
          size="middle"
          title="In hóa đơn GHN"
        >
          In hóa đơn
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <Table
          rowKey={(r) => r.id}
          loading={isLoading}
          columns={columns}
          dataSource={orders}
          expandable={{
            expandRowByClick: true,
            onExpand: async (expanded, record) => {
              // Load GHN order data when row is expanded
              if (expanded && !ghnOrderData[record.id] && !loadingGhnOrders[record.id]) {
                try {
                  setLoadingGhnOrders(prev => ({ ...prev, [record.id]: true }));
                  const ghnOrder = await GhnService.getGhnOrderByStoreOrderId(record.id);
                  if (ghnOrder && ghnOrder.data) {
                    setGhnOrderData(prev => ({ ...prev, [record.id]: ghnOrder.data }));
                  }
                } catch (error: any) {
                  console.error(`Error loading GHN order for ${record.id}:`, error);
                } finally {
                  setLoadingGhnOrders(prev => ({ ...prev, [record.id]: false }));
                }
              }

              // Load cancel requests when row is expanded
              if (expanded && !cancelRequestsData[record.id] && !loadingCancelRequests[record.id]) {
                try {
                  setLoadingCancelRequests(prev => ({ ...prev, [record.id]: true }));
                  const cancelRequests = await StoreOrderService.getCancelRequests(record.id);
                  setCancelRequestsData(prev => ({ ...prev, [record.id]: cancelRequests }));
                } catch (error: any) {
                  console.error(`Error loading cancel requests for ${record.id}:`, error);
                } finally {
                  setLoadingCancelRequests(prev => ({ ...prev, [record.id]: false }));
                }
              }
            },
            expandedRowRender: (record) => {
              const addr = [record.shipStreet, record.shipWard, record.shipDistrict, record.shipProvince].filter(Boolean).join(', ');
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Thông tin khách hàng" size="small" column={1} bordered>
                        <Descriptions.Item label="Tên">{maskCustomerInfo(record.customerName)}</Descriptions.Item>
                        <Descriptions.Item label="SĐT">{maskCustomerInfo(record.customerPhone)}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú KH">{maskCustomerInfo(record.customerMessage)}</Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Giao hàng" size="small" column={1} bordered>
                        <Descriptions.Item label="Người nhận">{maskCustomerInfo(record.shipReceiverName)}</Descriptions.Item>
                        <Descriptions.Item label="SĐT nhận">{maskCustomerInfo(record.shipPhoneNumber)}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{maskCustomerInfo(addr)}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{maskCustomerInfo(record.shipNote)}</Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Descriptions title="Thanh toán" size="small" column={1} bordered>
                        <Descriptions.Item label="Tạm tính">{formatCurrency(record.totalAmount)}</Descriptions.Item>
                        <Descriptions.Item label="Giảm giá">{formatCurrency(record.discountTotal)}</Descriptions.Item>
                        <Descriptions.Item label="Phí vận chuyển">{formatCurrency(record.shippingFee)}</Descriptions.Item>
                        <Descriptions.Item label="Tổng cộng">{formatCurrency(record.grandTotal)}</Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2">Sản phẩm ({record.items?.length || 0})</div>
                    <List
                      dataSource={record.items || []}
                      renderItem={(item: any) => (
                        <List.Item>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-500">SL: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                            </div>
                            <div className="text-right font-semibold">{formatCurrency(item.lineTotal)}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>

                  {/* GHN Shipping Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <div className="text-sm font-semibold">Thông tin vận chuyển GHN</div>
                    </div>
                    {loadingGhnOrders[record.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Đang tải thông tin vận chuyển...</span>
                      </div>
                    ) : ghnOrderData[record.id] ? (
                      <Descriptions size="small" column={1} bordered>
                        <Descriptions.Item label={
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>Mã đơn GHN</span>
                          </div>
                        }>
                          <Text code className="font-semibold">{ghnOrderData[record.id].orderGhn}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Tổng phí</span>
                          </div>
                        }>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(ghnOrderData[record.id].totalFee)}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label={
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Thời gian giao dự kiến</span>
                          </div>
                        }>
                          {new Date(ghnOrderData[record.id].expectedDeliveryTime).toLocaleString('vi-VN')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                          <Tag color={
                            ghnOrderData[record.id].status === 'READY_PICKUP' ? 'blue' :
                            ghnOrderData[record.id].status === 'SHIPPING' ? 'purple' :
                            ghnOrderData[record.id].status === 'DELIVERED' ? 'green' :
                            'default'
                          }>
                            {ghnOrderData[record.id].status === 'READY_PICKUP' ? 'Sẵn sàng lấy hàng' :
                             ghnOrderData[record.id].status === 'SHIPPING' ? 'Đang vận chuyển' :
                             ghnOrderData[record.id].status === 'DELIVERED' ? 'Đã giao hàng' :
                             ghnOrderData[record.id].status}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                          {new Date(ghnOrderData[record.id].createdAt).toLocaleString('vi-VN')}
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Chưa có thông tin vận chuyển GHN cho đơn hàng này
                      </div>
                    )}
                  </div>

                  {/* Cancellation Requests Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div className="text-sm font-semibold">Yêu cầu hủy đơn hàng</div>
                      {cancelRequestsData[record.id] && cancelRequestsData[record.id].length > 0 && (
                        <Tag color="red" className="ml-2">
                          {cancelRequestsData[record.id].length} yêu cầu
                        </Tag>
                      )}
                    </div>
                    {loadingCancelRequests[record.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Đang tải yêu cầu hủy đơn hàng...</span>
                      </div>
                    ) : cancelRequestsData[record.id] && cancelRequestsData[record.id].length > 0 ? (
                      <div className="space-y-3">
                        {cancelRequestsData[record.id].map((request: any, index: number) => (
                          <div
                            key={request.id}
                            className="border border-gray-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-700">
                                  Yêu cầu #{index + 1}
                                </span>
                                <Tag
                                  color={
                                    request.status === 'REQUESTED' ? 'orange' :
                                    request.status === 'APPROVED' ? 'green' :
                                    request.status === 'REJECTED' ? 'red' :
                                    'default'
                                  }
                                  className="ml-2"
                                >
                                  {request.status === 'REQUESTED' ? 'Đang chờ xử lý' :
                                   request.status === 'APPROVED' ? 'Đã chấp nhận' :
                                   request.status === 'REJECTED' ? 'Đã từ chối' :
                                   request.status}
                                </Tag>
                              </div>
                              <Text code className="text-xs text-gray-500">
                                {request.id.slice(0, 8)}...
                              </Text>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Lý do hủy:</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {request.reason === 'FOUND_BETTER_PRICE' ? 'Tìm thấy giá tốt hơn' :
                                   request.reason === 'CHANGE_OF_MIND' ? 'Thay đổi ý định' :
                                   request.reason === 'WRONG_ITEM' ? 'Sai sản phẩm' :
                                   request.reason === 'DELIVERY_ISSUE' ? 'Vấn đề giao hàng' :
                                   request.reason}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Ghi chú:</div>
                                <div className="text-sm text-gray-700">
                                  {request.note || <span className="text-gray-400 italic">Không có ghi chú</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Yêu cầu lúc:</span>
                                <span className="font-medium text-gray-700">
                                  {new Date(request.requestedAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              {request.processedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span>Xử lý lúc:</span>
                                  <span className="font-medium text-gray-700">
                                    {new Date(request.processedAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons - Only show for REQUESTED status */}
                            {request.status === 'REQUESTED' && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                <Button
                                  type="primary"
                                  icon={<Check className="w-4 h-4" />}
                                  onClick={async () => {
                                    const key = `${record.id}-${request.id}`;
                                    try {
                                      setProcessingCancelRequest(prev => ({ ...prev, [key]: true }));
                                      await StoreOrderService.approveCancelRequest(record.id);
                                      showCenterSuccess('Đã chấp nhận yêu cầu hủy đơn hàng và hoàn tiền', 'Thành công');
                                      
                                      // Refresh cancel requests
                                      const updatedRequests = await StoreOrderService.getCancelRequests(record.id);
                                      setCancelRequestsData(prev => ({ ...prev, [record.id]: updatedRequests }));
                                      
                                      // Refresh order list
                                      refresh();
                                    } catch (error: any) {
                                      showCenterError(error?.message || 'Không thể chấp nhận yêu cầu hủy đơn hàng', 'Lỗi');
                                    } finally {
                                      setProcessingCancelRequest(prev => ({ ...prev, [key]: false }));
                                    }
                                  }}
                                  disabled={processingCancelRequest[`${record.id}-${request.id}`]}
                                  loading={processingCancelRequest[`${record.id}-${request.id}`]}
                                  size="small"
                                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                >
                                  Chấp nhận hủy đơn
                                </Button>
                                <Button
                                  danger
                                  icon={<X className="w-4 h-4" />}
                                  onClick={() => {
                                    setShowRejectModal({ orderId: record.id, requestId: request.id });
                                    setRejectNote('');
                                  }}
                                  disabled={processingCancelRequest[`${record.id}-${request.id}`]}
                                  size="small"
                                >
                                  Không cho hủy đơn
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Chưa có yêu cầu hủy đơn hàng nào cho đơn hàng này
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
              }
            },
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '15', '20', '25'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div>
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                    <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng phù hợp với bộ lọc đã chọn.</p>
                  </div>
                }
              />
            ),
          }}
        />
      </div>

      {/* GHN Transfer Modal */}
      {ghnTransferOrderId && (
        <GhnTransferModal
          orderId={ghnTransferOrderId}
          onClose={() => setGhnTransferOrderId(null)}
          onSubmit={handleGhnTransferSubmit}
        />
      )}

      {/* Cancel GHN Order Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Hủy gọi vận chuyển GHN</span>
          </div>
        }
        open={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelOrderCode('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã đơn hàng GHN *
            </label>
            <Input
              value={cancelOrderCode}
              onChange={(e) => setCancelOrderCode(e.target.value)}
              placeholder="Nhập mã đơn hàng GHN (ví dụ: GYNP9EWK)"
              disabled={isCancelling}
              size="large"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập mã đơn hàng GHN mà bạn muốn hủy
            </p>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowCancelModal(false);
                setCancelOrderCode('');
              }}
              disabled={isCancelling}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleCancelGhnOrder}
              disabled={isCancelling || !cancelOrderCode.trim()}
              loading={isCancelling}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Token Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-500" />
            <span>In hóa đơn GHN</span>
          </div>
        }
        open={showPrintTokenModal}
        onCancel={() => {
          setShowPrintTokenModal(false);
          setPrintTokenOrderCode('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã đơn hàng GHN *
            </label>
            <Input
              value={printTokenOrderCode}
              onChange={(e) => setPrintTokenOrderCode(e.target.value)}
              placeholder="Nhập hoặc dán mã đơn hàng GHN (ví dụ: GYNPVL84)"
              disabled={isGettingPrintToken}
              size="large"
              onPressEnter={handleGetPrintToken}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập mã đơn hàng GHN để in hóa đơn
            </p>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowPrintTokenModal(false);
                setPrintTokenOrderCode('');
              }}
              disabled={isGettingPrintToken}
            >
              Đóng
            </Button>
            <Button
              type="primary"
              icon={<Printer className="w-4 h-4" />}
              onClick={handleGetPrintToken}
              disabled={isGettingPrintToken || !printTokenOrderCode.trim()}
              loading={isGettingPrintToken}
            >
              In hóa đơn
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Cancel Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <span>Từ chối yêu cầu hủy đơn hàng</span>
          </div>
        }
        open={showRejectModal !== null}
        onCancel={() => {
          setShowRejectModal(null);
          setRejectNote('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú từ chối (tùy chọn)
            </label>
            <Input.TextArea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Ví dụ: Đơn đã đóng gói, vui lòng liên hệ CSKH..."
              disabled={showRejectModal ? processingCancelRequest[`${showRejectModal.orderId}-${showRejectModal.requestId}`] : false}
              rows={4}
              maxLength={500}
              showCount
            />
            <p className="text-xs text-gray-500 mt-1">
              Ghi chú này sẽ được gửi đến khách hàng để giải thích lý do từ chối
            </p>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowRejectModal(null);
                setRejectNote('');
              }}
              disabled={showRejectModal ? processingCancelRequest[`${showRejectModal.orderId}-${showRejectModal.requestId}`] : false}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              icon={<X className="w-4 h-4" />}
              onClick={async () => {
                if (!showRejectModal) return;
                
                const key = `${showRejectModal.orderId}-${showRejectModal.requestId}`;
                try {
                  setProcessingCancelRequest(prev => ({ ...prev, [key]: true }));
                  await StoreOrderService.rejectCancelRequest(
                    showRejectModal.orderId,
                    rejectNote.trim() || undefined
                  );
                  showCenterSuccess('Đã từ chối yêu cầu hủy đơn hàng', 'Thành công');
                  
                  // Refresh cancel requests
                  const updatedRequests = await StoreOrderService.getCancelRequests(showRejectModal.orderId);
                  setCancelRequestsData(prev => ({ ...prev, [showRejectModal.orderId]: updatedRequests }));
                  
                  // Refresh order list
                  refresh();
                  
                  // Close modal
                  setShowRejectModal(null);
                  setRejectNote('');
                } catch (error: any) {
                  showCenterError(error?.message || 'Không thể từ chối yêu cầu hủy đơn hàng', 'Lỗi');
                } finally {
                  setProcessingCancelRequest(prev => ({ ...prev, [key]: false }));
                }
              }}
              disabled={showRejectModal ? processingCancelRequest[`${showRejectModal.orderId}-${showRejectModal.requestId}`] : false}
              loading={showRejectModal ? processingCancelRequest[`${showRejectModal.orderId}-${showRejectModal.requestId}`] : false}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderManageForStoreOwner;
