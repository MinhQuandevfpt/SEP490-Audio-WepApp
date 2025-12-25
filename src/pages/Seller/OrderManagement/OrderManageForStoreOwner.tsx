import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Descriptions, List, Divider, Empty, Button, Modal, Input, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Package, PackageCheck, Truck, Trash2, Printer, Calendar, DollarSign, XCircle, AlertCircle, Clock, Check, X, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';
import { StoreOrderFilter, GhnTransferModal, OrderStatistics } from '../../../components/StoreOwnerOrderManagementComponents';
import useStoreOrders from '../../../hooks/useStoreOrders';
import type { StoreOrder } from '../../../types/seller';
import { formatCurrency, getStatusLabel } from '../../../utils/orderStatus';
import { StoreOrderService } from '../../../services/seller/OrderService';
import { GhnService } from '../../../services/seller/GhnService';
import { ProductListService } from '../../../services/customer/ProductListService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import { useLocation, useNavigate } from 'react-router-dom';

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

// Helper function to get GHN status label and color
const getGhnStatusInfo = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    'CANCEL': { label: 'Đã hủy', color: 'red' },
    'CANCELED': { label: 'Đã hủy', color: 'red' },
    'DAMAGE': { label: 'Hàng hư hỏng', color: 'volcano' },
    'DELIVERED': { label: 'Đã giao hàng', color: 'green' },
    'DELIVERING': { label: 'Đang giao hàng', color: 'processing' },
    'DELIVERY_FAIL': { label: 'Giao hàng thất bại', color: 'red' },
    'EXCEPTION': { label: 'Ngoại lệ', color: 'volcano' },
    'GHN_CREATED': { label: 'Đã tạo đơn GHN', color: 'blue' },
    'LOST': { label: 'Thất lạc', color: 'red' },
    'MONEY_COLLECT_DELIVERING': { label: 'Đang thu tiền khi giao', color: 'orange' },
    'MONEY_COLLECT_PICKING': { label: 'Đang thu tiền khi lấy', color: 'orange' },
    'ON_DELIVERY': { label: 'Đang giao hàng', color: 'processing' },
    'PICKED': { label: 'Đã lấy hàng', color: 'cyan' },
    'PICKING': { label: 'Đang lấy hàng', color: 'cyan' },
    'READY_PICKUP': { label: 'Sẵn sàng lấy hàng', color: 'blue' },
    'READY_TO_PICK': { label: 'Sẵn sàng lấy hàng', color: 'blue' },
    'RETURN': { label: 'Trả hàng', color: 'orange' },
    'RETURNED': { label: 'Đã trả hàng', color: 'default' },
    'RETURNING': { label: 'Đang trả hàng', color: 'orange' },
    'RETURN_FAIL': { label: 'Trả hàng thất bại', color: 'red' },
    'RETURN_SORTING': { label: 'Đang phân loại trả hàng', color: 'orange' },
    'RETURN_TRANSPORTING': { label: 'Đang vận chuyển trả hàng', color: 'orange' },
    'SORTING': { label: 'Đang phân loại', color: 'purple' },
    'STORING': { label: 'Đang lưu kho', color: 'purple' },
    'TRANSPORTING': { label: 'Đang vận chuyển', color: 'purple' },
    'WAITING_TO_RETURN': { label: 'Chờ trả hàng', color: 'orange' },
    'SHIPPING': { label: 'Đang vận chuyển', color: 'purple' },
  };

  return statusMap[status] || { label: status, color: 'default' };
};

// Helper function to calculate remaining time until auto-cancel (24 hours from createdAt)
const calculateTimeUntilAutoCancel = (createdAt: string): { 
  totalSeconds: number; 
  hours: number; 
  minutes: number; 
  seconds: number;
  isExpired: boolean;
} => {
  const createdAtDate = new Date(createdAt);
  const deadlineDate = new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { totalSeconds, hours, minutes, seconds, isExpired: false };
};

// Helper function to format countdown time
const formatCountdown = (hours: number, minutes: number, seconds: number): string => {
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to get countdown color based on remaining time
const getCountdownColor = (totalSeconds: number): string => {
  const hours = totalSeconds / 3600;
  if (hours < 1) return 'text-red-600 font-bold'; // < 1h: đỏ
  if (hours < 6) return 'text-orange-600 font-semibold'; // < 6h: vàng
  return 'text-green-600'; // > 6h: xanh
};

const OrderManageForStoreOwner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    status,
    setStatus,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
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

  // Track expanded rows for auto-expand behavior
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Read customerOrderId from query (used when coming from notification)
  const searchParams = new URLSearchParams(location.search);
  const targetCustomerOrderId = searchParams.get('customerOrderId');
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

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
  const [showCancelOrderModal, setShowCancelOrderModal] = useState<{ orderId: string; orderCode: string } | null>(null);
  const [cancelOrderReason, setCancelOrderReason] = useState('');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  
  // Countdown state for PENDING orders (orderId -> { hours, minutes, seconds, totalSeconds, isExpired })
  const [pendingCountdowns, setPendingCountdowns] = useState<Record<string, { hours: number; minutes: number; seconds: number; totalSeconds: number; isExpired: boolean }>>({});
  
  // Countdown state for AWAITING_SHIPMENT orders (orderId -> { hours, minutes, seconds, totalSeconds, isExpired })
  const [awaitingShipmentCountdowns, setAwaitingShipmentCountdowns] = useState<Record<string, { hours: number; minutes: number; seconds: number; totalSeconds: number; isExpired: boolean }>>({});
  
  // Product images cache (productId -> images[])
  const [productImages, setProductImages] = useState<Record<string, string[]>>({});
  const [loadingProductImages, setLoadingProductImages] = useState<Record<string, boolean>>({});

  // Auto-expand order when navigated from notification with customerOrderId
  useEffect(() => {
    if (!targetCustomerOrderId || hasAutoExpanded || isLoading || !orders || orders.length === 0) {
      return;
    }

    const targetOrder = orders.find((o) => o.customerOrderId === targetCustomerOrderId || o.id === targetCustomerOrderId);
    if (targetOrder) {
      setExpandedRowKeys((prev) =>
        prev.includes(targetOrder.id) ? prev : [...prev, targetOrder.id]
      );
      setHasAutoExpanded(true);

      // Xóa query param để tránh tự expand lại khi user điều hướng trong trang
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('customerOrderId');
      navigate(cleanUrl.pathname + cleanUrl.search, { replace: true });
    }
  }, [targetCustomerOrderId, hasAutoExpanded, isLoading, orders, navigate]);

  // Update countdown for PENDING orders every second
  useEffect(() => {
    const pendingOrders = orders.filter(order => order.status === 'PENDING' && order.createdAt);
    
    if (pendingOrders.length === 0) {
      setPendingCountdowns({});
      return;
    }

    // Calculate initial countdowns
    const initialCountdowns: Record<string, { hours: number; minutes: number; seconds: number; totalSeconds: number; isExpired: boolean }> = {};
    pendingOrders.forEach(order => {
      const timeInfo = calculateTimeUntilAutoCancel(order.createdAt);
      initialCountdowns[order.id] = {
        hours: timeInfo.hours,
        minutes: timeInfo.minutes,
        seconds: timeInfo.seconds,
        totalSeconds: timeInfo.totalSeconds,
        isExpired: timeInfo.isExpired,
      };
    });
    setPendingCountdowns(initialCountdowns);

    // Update countdown every second
    const interval = setInterval(() => {
      setPendingCountdowns(prev => {
        const updated: typeof prev = {};
        pendingOrders.forEach(order => {
          const timeInfo = calculateTimeUntilAutoCancel(order.createdAt);
          updated[order.id] = {
            hours: timeInfo.hours,
            minutes: timeInfo.minutes,
            seconds: timeInfo.seconds,
            totalSeconds: timeInfo.totalSeconds,
            isExpired: timeInfo.isExpired,
          };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  // Update countdown for AWAITING_SHIPMENT orders every second (based on confirmedAt)
  useEffect(() => {
    const awaitingShipmentOrders = orders.filter(order => 
      order.status === 'AWAITING_SHIPMENT' && (order as any).confirmedAt
    );
    
    if (awaitingShipmentOrders.length === 0) {
      setAwaitingShipmentCountdowns({});
      return;
    }

    // Calculate initial countdowns based on confirmedAt
    const initialCountdowns: Record<string, { hours: number; minutes: number; seconds: number; totalSeconds: number; isExpired: boolean }> = {};
    awaitingShipmentOrders.forEach(order => {
      const timeInfo = calculateTimeUntilAutoCancel((order as any).confirmedAt);
      initialCountdowns[order.id] = {
        hours: timeInfo.hours,
        minutes: timeInfo.minutes,
        seconds: timeInfo.seconds,
        totalSeconds: timeInfo.totalSeconds,
        isExpired: timeInfo.isExpired,
      };
    });
    setAwaitingShipmentCountdowns(initialCountdowns);

    // Update countdown every second
    const interval = setInterval(() => {
      setAwaitingShipmentCountdowns(prev => {
        const updated: typeof prev = {};
        awaitingShipmentOrders.forEach(order => {
          const timeInfo = calculateTimeUntilAutoCancel((order as any).confirmedAt);
          updated[order.id] = {
            hours: timeInfo.hours,
            minutes: timeInfo.minutes,
            seconds: timeInfo.seconds,
            totalSeconds: timeInfo.totalSeconds,
            isExpired: timeInfo.isExpired,
          };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  // Load cancel requests for AWAITING_SHIPMENT orders to check if button should be disabled
  useEffect(() => {
    if (!orders || orders.length === 0 || isLoading) {
      return;
    }

    const awaitingShipmentOrders = orders.filter(
      (order) => order.status === 'AWAITING_SHIPMENT' && !cancelRequestsData[order.id] && !loadingCancelRequests[order.id]
    );

    if (awaitingShipmentOrders.length === 0) {
      return;
    }

    // Load cancel requests for all AWAITING_SHIPMENT orders
    awaitingShipmentOrders.forEach(async (order) => {
      try {
        setLoadingCancelRequests(prev => ({ ...prev, [order.id]: true }));
        const cancelRequests = await StoreOrderService.getCancelRequests(order.id);
        setCancelRequestsData(prev => ({ ...prev, [order.id]: cancelRequests }));
      } catch (error: any) {
        console.error(`Error loading cancel requests for ${order.id}:`, error);
        // Set empty array on error to avoid retrying
        setCancelRequestsData(prev => ({ ...prev, [order.id]: [] }));
      } finally {
        setLoadingCancelRequests(prev => ({ ...prev, [order.id]: false }));
      }
    });
  }, [orders, isLoading]);

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

  const handleCancelOrder = async () => {
    if (!showCancelOrderModal) return;

    if (!cancelOrderReason || !cancelOrderReason.trim()) {
      showCenterError('Vui lòng nhập lý do hủy đơn hàng', 'Lỗi');
      return;
    }

    try {
      setIsCancellingOrder(true);
      
      console.log('🔄 Cancelling order:', showCancelOrderModal.orderId);
      
      await StoreOrderService.cancelOrder(showCancelOrderModal.orderId, cancelOrderReason.trim());
      
      showCenterSuccess('Đã hủy đơn hàng thành công!', 'Thành công', 3000);
      
      // Reset modal
      setShowCancelOrderModal(null);
      setCancelOrderReason('');
      
      // Refresh order list
      refresh();
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);
      showCenterError(
        error?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Helper function to check if order has pending cancel request (status = REQUESTED)
  const hasPendingCancelRequest = (orderId: string): boolean => {
    const requests = cancelRequestsData[orderId];
    if (!requests || !Array.isArray(requests)) {
      return false;
    }
    return requests.some((request: any) => request.status === 'REQUESTED');
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
      render: (status: string, record: StoreOrder) => {
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
          RETURNING: 'orange',
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
        
        // Hiển thị countdown cho đơn PENDING
        if (status === 'PENDING' && record.createdAt) {
          const countdown = pendingCountdowns[record.id];
          if (countdown) {
            const { hours, minutes, seconds, isExpired } = countdown;
            if (isExpired) {
              return (
                <div className="flex flex-col gap-1">
                  <Tag color="red">{label}</Tag>
                  <div className="text-xs text-red-600 font-semibold">
                    ⚠️ Đã quá hạn - Đơn sẽ bị hủy tự động
                  </div>
                </div>
              );
            }
            const countdownText = formatCountdown(hours, minutes, seconds);
            const countdownColor = getCountdownColor(countdown.totalSeconds);
            return (
              <div className="flex flex-col gap-1">
                <Tag color={colorMap[status] || 'default'}>{label}</Tag>
                <div className={`text-xs ${countdownColor} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  <span>Còn lại: {countdownText}</span>
                </div>
              </div>
            );
          }
        }
        
        // Hiển thị countdown cho đơn AWAITING_SHIPMENT
        if (status === 'AWAITING_SHIPMENT' && (record as any).confirmedAt) {
          const countdown = awaitingShipmentCountdowns[record.id];
          if (countdown) {
            const { hours, minutes, seconds, isExpired } = countdown;
            if (isExpired) {
              return (
                <div className="flex flex-col gap-1">
                  <Tag color={colorMap[status] || 'default'}>{label}</Tag>
                  <div className="text-xs text-red-600 font-semibold">
                    ⚠️ Đã quá hạn - Sẽ bị trừ điểm uy tín
                  </div>
                </div>
              );
            }
            const countdownText = formatCountdown(hours, minutes, seconds);
            const countdownColor = getCountdownColor(countdown.totalSeconds);
            return (
              <div className="flex flex-col gap-1">
                <Tag color={colorMap[status] || 'default'}>{label}</Tag>
                <div className={`text-xs ${countdownColor} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  <span>Còn lại: {countdownText}</span>
                </div>
              </div>
            );
          }
        }
        
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
        const mask3 = (val?: string | null) => {
          if (!val || !val.trim()) return '';
          const t = val.trim();
          if (t.length <= 6) {
            return `${t.slice(0, Math.min(3, t.length))}...${t.slice(-1)}`;
          }
          return `${t.slice(0, 3)}...${t.slice(-3)}`;
        };
        return (
          <div className="max-w-xs">
            <div className="font-medium text-gray-800">
              {mask3(r.shipReceiverName) || '---'}
            </div>
            <div className="text-xs text-gray-500">
              {mask3(addr) || '---'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        const isAwaitingShipment = record.status === 'AWAITING_SHIPMENT';
        const isPreparing = preparingOrderId === record.id;
        const isCancelling = showCancelOrderModal?.orderId === record.id && isCancellingOrder;
        const hasGhnOrder = !!ghnOrderData[record.id];
        
        if (isPending) {
          return (
            <div className="flex flex-col gap-2">
              <Button
                type="primary"
                icon={<PackageCheck className="w-4 h-4" />}
                onClick={() => handlePrepareOrder(record.id)}
                disabled={isPreparing || isCancelling}
                loading={isPreparing}
                size="small"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                title="Xác nhận lên đơn hàng"
                className="w-full"
              >
                {isPreparing ? 'Đang xử lý...' : 'Xác nhận lên đơn hàng'}
              </Button>
              <Button
                danger
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  setShowCancelOrderModal({ orderId: record.id, orderCode: record.orderCode || '' });
                  setCancelOrderReason('');
                }}
                disabled={isPreparing || isCancelling}
                loading={isCancelling}
                size="small"
                className="w-full"
                title="Hủy chuẩn bị đơn hàng"
              >
                Hủy chuẩn bị đơn
              </Button>
            </div>
          );
        }
        
        // Chỉ cho phép "Chuyển nhượng GHN" khi đơn đang chờ lấy hàng
        // và CHƯA có thông tin vận chuyển GHN trong hệ thống
        // và KHÔNG có yêu cầu hủy đơn đang chờ xử lý (status = REQUESTED)
        if (isAwaitingShipment && !hasGhnOrder) {
          const hasPendingRequest = hasPendingCancelRequest(record.id);
          return (
            <Button
              type="primary"
              icon={<Truck className="w-4 h-4" />}
              onClick={() => setGhnTransferOrderId(record.id)}
              disabled={hasPendingRequest}
              size="small"
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              title={hasPendingRequest ? 'Không thể chuyển nhượng GHN vì có yêu cầu hủy đơn đang chờ xử lý' : 'Chuyển nhượng GHN'}
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

      {/* Order Statistics with Sidebar */}
      <OrderStatistics onStatusChange={(status) => setStatus(status as any)} />

      <StoreOrderFilter
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => {
          setFromDate(from);
          setToDate(to);
        }}
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
            expandedRowKeys,
            expandRowByClick: true,
            onExpand: async (expanded, record) => {
              // Manage expanded row keys
              setExpandedRowKeys((prev) =>
                expanded ? [...prev, record.id] : prev.filter((key) => key !== record.id)
              );

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

              // Load product images when row is expanded
              if (expanded && record.items) {
                record.items.forEach(async (item: any) => {
                  if (item.refId && !productImages[item.refId] && !loadingProductImages[item.refId]) {
                    try {
                      setLoadingProductImages(prev => ({ ...prev, [item.refId]: true }));
                      const productData = await ProductListService.getProductById(item.refId);
                      if (productData.data?.images && productData.data.images.length > 0) {
                        setProductImages(prev => ({ ...prev, [item.refId]: productData.data.images || [] }));
                      }
                    } catch (error: any) {
                      console.error(`Error loading product images for ${item.refId}:`, error);
                    } finally {
                      setLoadingProductImages(prev => ({ ...prev, [item.refId]: false }));
                    }
                  }
                });
              }
            },
            expandedRowRender: (record) => {
              const addr = [record.shipStreet, record.shipWard, record.shipDistrict, record.shipProvince].filter(Boolean).join(', ');
              const isPending = record.status === 'PENDING';
              const isAwaitingShipment = record.status === 'AWAITING_SHIPMENT';
              const pendingCountdown = isPending && record.createdAt ? pendingCountdowns[record.id] : null;
              const awaitingShipmentCountdown = isAwaitingShipment && (record as any).confirmedAt ? awaitingShipmentCountdowns[record.id] : null;
              
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  {/* Notification cảnh báo cho đơn PENDING */}
                  {isPending && pendingCountdown && (
                    <Alert
                      message={
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-semibold">Cảnh báo: Đơn hàng sắp hết hạn xác nhận</span>
                        </div>
                      }
                      description={
                        <div className="mt-2">
                          {pendingCountdown.isExpired ? (
                            <div className="text-red-700 font-semibold">
                              ⚠️ Đơn hàng đã quá 24 giờ kể từ khi tạo. Đơn sẽ bị hủy tự động nếu không được xác nhận ngay!
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-700 mb-1">
                                Bạn còn <span className={`font-bold text-lg ${getCountdownColor(pendingCountdown.totalSeconds)}`}>
                                  {formatCountdown(pendingCountdown.hours, pendingCountdown.minutes, pendingCountdown.seconds)}
                                </span> để xác nhận đơn hàng này.
                              </p>
                              <p className="text-sm text-gray-600">
                                Nếu không xác nhận trong thời gian này, đơn hàng sẽ tự động bị hủy và cửa hàng của bạn sẽ bị trừ điểm uy tín.
                              </p>
                            </div>
                          )}
                        </div>
                      }
                      type={pendingCountdown.isExpired ? 'error' : pendingCountdown.hours < 1 ? 'error' : pendingCountdown.hours < 6 ? 'warning' : 'info'}
                      showIcon
                      icon={<AlertTriangle className="w-4 h-4" />}
                      className="mb-4"
                    />
                  )}
                  
                  {/* Notification cảnh báo cho đơn AWAITING_SHIPMENT */}
                  {isAwaitingShipment && awaitingShipmentCountdown && (
                    <Alert
                      message={
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-semibold">Cảnh báo: Cần chuẩn bị hàng và chuyển nhượng GHN</span>
                        </div>
                      }
                      description={
                        <div className="mt-2">
                          {awaitingShipmentCountdown.isExpired ? (
                            <div className="text-red-700 font-semibold">
                              ⚠️ Đã quá 24 giờ kể từ khi xác nhận đơn hàng. Cửa hàng của bạn sẽ bị trừ điểm uy tín nếu không chuẩn bị hàng và chuyển nhượng GHN ngay!
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-700 mb-1">
                                Bạn còn <span className={`font-bold text-lg ${getCountdownColor(awaitingShipmentCountdown.totalSeconds)}`}>
                                  {formatCountdown(awaitingShipmentCountdown.hours, awaitingShipmentCountdown.minutes, awaitingShipmentCountdown.seconds)}
                                </span> để chuẩn bị hàng và chuyển nhượng GHN.
                              </p>
                              <p className="text-sm text-gray-600">
                                Nếu không chuẩn bị hàng và chuyển nhượng GHN trong thời gian này, cửa hàng của bạn sẽ bị trừ điểm uy tín.
                              </p>
                            </div>
                          )}
                        </div>
                      }
                      type={awaitingShipmentCountdown.isExpired ? 'error' : awaitingShipmentCountdown.hours < 1 ? 'error' : awaitingShipmentCountdown.hours < 6 ? 'warning' : 'info'}
                      showIcon
                      icon={<AlertTriangle className="w-4 h-4" />}
                      className="mb-4"
                    />
                  )}
                  
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
                      <Descriptions.Item label="Giá gốc (chưa giảm giá)">
                        {formatCurrency(record.totalAmount)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng giảm giá">
                        {formatCurrency(record.discountTotal)}
                      </Descriptions.Item>
                      {Array.isArray((record as any).shopVouchers) && (record as any).shopVouchers.length > 0 && (
                        <Descriptions.Item label="Voucher shop áp dụng">
                          {(record as any).shopVouchers.map((v: any, idx: number) => (
                            <div key={`${v.code}-${idx}`} className="flex justify-between text-xs">
                              <span className="font-medium">{v.code}</span>
                              <span className="text-red-600">
                                -{formatCurrency(v.discount)}
                              </span>
                            </div>
                          ))}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Phí vận chuyển khách trả">
                        {formatCurrency(record.shippingFee)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng cộng">
                        {formatCurrency(record.grandTotal)}
                      </Descriptions.Item>
                      {(record as any).paymentMethod && (
                        <Descriptions.Item label="Phương thức thanh toán">
                          {(record as any).paymentMethod}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                  </div>

                  <Divider className="my-4" />

                  {/* Thông tin tài chính - Luồng tiền */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="w-5 h-5 text-green-600" />
                      <div className="text-sm font-semibold">Thông tin tài chính</div>
                    </div>
                    <Descriptions title="Tổng hợp tài chính đơn hàng" size="small" column={1} bordered>
                      <Descriptions.Item label="Tổng giá trị đơn hàng">
                        <span className="font-semibold text-gray-800">{formatCurrency(record.grandTotal)}</span>
                      </Descriptions.Item>
                      {(record as any).platformFeeAmount !== undefined && (
                        <Descriptions.Item label={
                          <div className="flex items-center gap-1">
                            <span>Phí nền tảng</span>
                            {(record as any).platformFeePercentage !== undefined && (
                              <Tag color="orange" className="ml-1">
                                {(record as any).platformFeePercentage}%
                              </Tag>
                            )}
                          </div>
                        }>
                          <span className="font-semibold text-orange-600">
                            -{formatCurrency((record as any).platformFeeAmount)}
                          </span>
                        </Descriptions.Item>
                      )}
                      {(() => {
                        // Tính tổng netPayoutItem từ tất cả các items
                        const totalNetPayoutFromItems = record.items?.reduce((sum: number, item: any) => {
                          return sum + (item.netPayoutItem || 0);
                        }, 0) || 0;
                        
                        // Sử dụng netPayoutToStore nếu có và > 0, nếu không thì tính từ items
                        const netPayoutToDisplay = (record as any).netPayoutToStore !== undefined && (record as any).netPayoutToStore > 0
                          ? (record as any).netPayoutToStore
                          : totalNetPayoutFromItems;
                        
                        if (netPayoutToDisplay > 0 || (record as any).netPayoutToStore !== undefined) {
                          return (
                            <Descriptions.Item label={
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span className="font-semibold">Số tiền cửa hàng nhận được</span>
                                {(record as any).netPayoutToStore === 0 || (record as any).netPayoutToStore === undefined ? (
                                  <Tag color="blue" className="ml-1 text-xs">
                                    (Tính từ sản phẩm)
                                  </Tag>
                                ) : null}
                              </div>
                            }>
                              <span className="font-bold text-lg text-green-600">
                                {formatCurrency(netPayoutToDisplay)}
                              </span>
                            </Descriptions.Item>
                          );
                        }
                        return null;
                      })()}
                      {(record as any).confirmedAt && (
                        <Descriptions.Item label="Thời gian xác nhận thanh toán">
                          <span className="text-sm text-gray-600">
                            {new Date((record as any).confirmedAt).toLocaleString('vi-VN')}
                          </span>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>

                  <Divider className="my-4" />

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2">Sản phẩm ({record.items?.length || 0})</div>
                    <List
                      dataSource={record.items || []}
                      renderItem={(item: any) => {
                        const originalUnit = item.unitPriceBeforeDiscount ?? item.unitPrice;
                        const originalLine = item.linePriceBeforeDiscount ?? originalUnit * item.quantity;
                        const finalUnit = item.finalUnitPrice ?? item.unitPrice;
                        const finalLine = item.finalLineTotal ?? finalUnit * item.quantity;

                        const itemImages = item.refId ? productImages[item.refId] : null;
                        const isLoadingImages = item.refId ? loadingProductImages[item.refId] : false;
                        
                        return (
                          <List.Item>
                            <div className="w-full">
                              <div className="flex items-start justify-between mb-2 gap-4">
                                {/* Product Image */}
                                {item.refId && (
                                  <div className="flex-shrink-0">
                                    {isLoadingImages ? (
                                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                      </div>
                                    ) : itemImages && itemImages.length > 0 ? (
                                      <img
                                        src={itemImages[0]}
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex-1 pr-4">
                                  <div className="font-medium text-gray-800">{item.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Giá gốc: {formatCurrency(originalUnit)} × {item.quantity} = {formatCurrency(originalLine)}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-600">
                                    Giá sau giảm: {formatCurrency(finalUnit)} × {item.quantity} ={' '}
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(finalLine)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right text-sm font-semibold">
                                  {formatCurrency(finalLine)}
                                </div>
                              </div>
                              
                              {/* Thông tin tài chính cho từng item */}
                              {(item.shippingFeeEstimated !== undefined || 
                                item.shippingFeeActual !== undefined || 
                                item.platformFeeAmount !== undefined || 
                                item.netPayoutItem !== undefined) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded p-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                    <Wallet className="w-3 h-3" />
                                    Thông tin tài chính sản phẩm:
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {item.shippingFeeEstimated !== undefined && (
                                      <div>
                                        <span className="text-gray-500">Phí vận chuyển dự kiến:</span>
                                        <span className="ml-1 font-medium text-gray-700">
                                          {formatCurrency(item.shippingFeeEstimated)}
                                        </span>
                                      </div>
                                    )}
                                    {item.shippingFeeActual !== undefined && (
                                      <div>
                                        <span className="text-gray-500">Phí vận chuyển thực tế:</span>
                                        <span className="ml-1 font-medium text-gray-700">
                                          {formatCurrency(item.shippingFeeActual)}
                                        </span>
                                      </div>
                                    )}
                                    {item.shippingExtraForStore !== undefined && item.shippingExtraForStore > 0 && (
                                      <div>
                                        <span className="text-gray-500">Phí vận chuyển bổ sung:</span>
                                        <span className="ml-1 font-medium text-green-600">
                                          +{formatCurrency(item.shippingExtraForStore)}
                                        </span>
                                      </div>
                                    )}
                                    {item.platformFeeAmount !== undefined && (
                                      <div>
                                        <span className="text-gray-500">Phí nền tảng</span>
                                        {item.platformFeePercentage !== undefined && (
                                          <Tag color="orange" className="ml-1 text-xs">
                                            {item.platformFeePercentage}%
                                          </Tag>
                                        )}
                                        <span className="ml-1 font-medium text-orange-600">
                                          -{formatCurrency(item.platformFeeAmount)}
                                        </span>
                                      </div>
                                    )}
                                    {item.netPayoutItem !== undefined && (
                                      <div className="col-span-2 mt-1 pt-2 border-t border-gray-300">
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-700 font-semibold flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-green-600" />
                                            Số tiền cửa hàng nhận được:
                                          </span>
                                          <span className="font-bold text-green-600">
                                            {formatCurrency(item.netPayoutItem)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {item.payoutProcessed !== undefined && (
                                      <div className="col-span-2 mt-1">
                                        <Tag color={item.payoutProcessed ? 'green' : 'default'} className="text-xs">
                                          {item.payoutProcessed ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                                        </Tag>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </List.Item>
                        );
                      }}
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
                          {(() => {
                            const statusInfo = getGhnStatusInfo(ghnOrderData[record.id].status);
                            return (
                              <Tag color={statusInfo.color}>
                                {statusInfo.label}
                              </Tag>
                            );
                          })()}
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
                                   request.reason === 'WRONG_INFO_OR_ADDRESS' ? 'Sai thông tin/địa chỉ' :
                                   request.reason === 'ORDERED_BY_ACCIDENT' ? 'Đặt nhầm' :
                                   request.reason === 'OTHER' ? 'Khác' :
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
                                      
                                      // Kiểm tra xem có GHN code không
                                      const ghnCode = ghnOrderData[record.id]?.orderGhn;
                                      
                                      if (ghnCode) {
                                        // Nếu có GHN code, gọi cả 2 API
                                        console.log('🔄 Approving cancel request with GHN code:', ghnCode);
                                        
                                        // Gọi API approve cancel request
                                        await StoreOrderService.approveCancelRequest(record.id);
                                        
                                        // Gọi API hủy đơn GHN
                                        await GhnService.cancelOrder([ghnCode]);
                                        
                                        showCenterSuccess('Đã chấp nhận yêu cầu hủy đơn hàng, hủy đơn GHN và hoàn tiền', 'Thành công');
                                      } else {
                                        // Nếu không có GHN code, chỉ gọi API approve
                                        await StoreOrderService.approveCancelRequest(record.id);
                                        showCenterSuccess('Đã chấp nhận yêu cầu hủy đơn hàng và hoàn tiền', 'Thành công');
                                      }
                                      
                                      // Refresh cancel requests
                                      const updatedRequests = await StoreOrderService.getCancelRequests(record.id);
                                      setCancelRequestsData(prev => ({ ...prev, [record.id]: updatedRequests }));
                                      
                                      // Refresh order list
                                      refresh();
                                    } catch (error: any) {
                                      console.error('❌ Error approving cancel request:', error);
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

      {/* Cancel Order Modal (for PENDING orders) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span>Hủy chuẩn bị đơn hàng</span>
          </div>
        }
        open={showCancelOrderModal !== null}
        onCancel={() => {
          setShowCancelOrderModal(null);
          setCancelOrderReason('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-4">
          {showCancelOrderModal && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Mã đơn hàng:</div>
                <div className="font-semibold text-gray-900">{showCancelOrderModal.orderCode || showCancelOrderModal.orderId}</div>
              </div>
              
              <Alert
                message="Cảnh báo"
                description="Nếu hủy đơn hàng, cửa hàng của bạn sẽ bị trừ điểm uy tín!"
                type="warning"
                showIcon
                icon={<AlertCircle className="w-4 h-4" />}
                className="mb-2"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy đơn hàng <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  value={cancelOrderReason}
                  onChange={(e) => setCancelOrderReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn hàng (ví dụ: Hết hàng, Khách hàng yêu cầu hủy...)"
                  disabled={isCancellingOrder}
                  rows={4}
                  maxLength={500}
                  showCount
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lý do này sẽ được lưu lại và có thể được gửi đến khách hàng
                </p>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowCancelOrderModal(null);
                    setCancelOrderReason('');
                  }}
                  disabled={isCancellingOrder}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={handleCancelOrder}
                  disabled={isCancellingOrder || !cancelOrderReason.trim()}
                  loading={isCancellingOrder}
                >
                  Xác nhận hủy đơn
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OrderManageForStoreOwner;
