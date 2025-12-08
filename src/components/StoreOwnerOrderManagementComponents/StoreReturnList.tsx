import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Pagination, Empty, Spin, Button, message, Modal, Input } from 'antd';
import { ZoomIn, Video as VideoIcon, X, Package } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../types/api';
import { formatDate, formatCurrency } from '../../utils/orderStatus';
import { StoreReturnService } from '../../services/seller/StoreReturnService';
import PickShiftModal from './PickShiftModal';
import { GhnService } from '../../services/seller/GhnService';
import { ProductListService } from '../../services/customer/ProductListService';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface StoreReturnListProps {
  data: ReturnRequestResponse[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  error?: string | null;
  onPageChange: (page: number, pageSize?: number) => void;
  onReload?: () => void;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  CANCELED: 'gray',
  AUTO_REFUNDED: 'gray',
  SHIPPING: 'blue',
  RECEIVED: 'cyan',
  DISPUTE: 'orange',
  DISPUTE_ESCALATED: 'purple',
  DISPUTE_RESOLVED_SHOP: 'green',
  DISPUTE_RESOLVED_CUSTOMER: 'red',
  REFUNDED: 'green',
  RETURN_DONE: 'blue',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Khách hàng yêu cầu',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Yêu cầu mới – Chờ xử lý',
  APPROVED: 'Đã duyệt – Chờ khách gửi hàng',
  REJECTED: 'Từ chối hoàn trả',
  CANCELLED: 'Đã huỷ (khách không gửi hàng)',
  CANCELED: 'Đã huỷ (khách hủy yêu cầu)',
  AUTO_REFUNDED: 'AUTO REFUND – Shop không xử lý sau khi nhận hàng',
  SHIPPING: 'GHN đang vận chuyển',
  RECEIVED: 'Shop xác nhận đã nhận đúng hàng',
  DISPUTE: 'Đang khiếu nại',
  DISPUTE_ESCALATED: 'Khiếu nại đã được đưa lên sàn xử lý',
  DISPUTE_RESOLVED_SHOP: 'Khiếu nại đã được giải quyết có lợi cho shop',
  DISPUTE_RESOLVED_CUSTOMER: 'Khiếu nại đã được giải quyết có lợi cho khách hàng',
  REFUNDED: 'Đã hoàn tiền',
  RETURN_DONE: 'Hoàn tất quy trình trả hàng',
};

const trackingStatusLabelMap: Record<string, string> = {
  // Status mặc định
  CREATED_WAITING_SYNC: 'Đang chờ đồng bộ từ GHN',
  
  // Status lấy hàng
  READY_TO_PICK: 'Sẵn sàng lấy hàng',
  ready_to_pick: 'Sẵn sàng lấy hàng',
  PICKING: 'Đang lấy hàng',
  picking_up: 'Đang lấy hàng',
  picking: 'Đang lấy hàng',
  MONEY_COLLECT_PICKING: 'Đang thu tiền khi lấy hàng',
  money_collect_picking: 'Đang thu tiền khi lấy hàng',
  PICKED: 'Đã lấy hàng',
  picked: 'Đã lấy hàng',
  
  // Status vận chuyển
  STORING: 'Đang lưu kho',
  storing: 'Đang lưu kho',
  TRANSPORTING: 'Đang vận chuyển',
  transporting: 'Đang vận chuyển',
  SORTING: 'Đang phân loại',
  sorting: 'Đang phân loại',
  
  // Status giao hàng
  DELIVERING: 'Đang giao hàng',
  delivering: 'Đang giao hàng',
  MONEY_COLLECT_DELIVERING: 'Đang thu tiền khi giao hàng',
  money_collect_delivering: 'Đang thu tiền khi giao hàng',
  DELIVERED: 'Đã giao hàng',
  delivered: 'Đã giao hàng',
  
  // Status trả hàng
  WAITING_TO_RETURN: 'Chờ trả hàng',
  waiting_to_return: 'Chờ trả hàng',
  RETURN: 'Trả hàng',
  return: 'Trả hàng',
  RETURN_TRANSPORTING: 'Đang vận chuyển trả hàng',
  return_transporting: 'Đang vận chuyển trả hàng',
  RETURN_SORTING: 'Đang phân loại trả hàng',
  return_sorting: 'Đang phân loại trả hàng',
  RETURNING: 'Đang trả hàng',
  returning: 'Đang trả hàng',
  
  // Status hủy
  CANCEL: 'Đã hủy',
  cancel: 'Đã hủy',
};

const StoreReturnList: React.FC<StoreReturnListProps> = ({
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onPageChange,
  onReload,
}) => {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [pickShiftModalOpen, setPickShiftModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestResponse | null>(null);
  const [pickShiftLoading, setPickShiftLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderCode, setCancelOrderCode] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ visible: boolean; urls: string[]; current: number }>({
    visible: false,
    urls: [],
    current: 0,
  });
  const [videoPreview, setVideoPreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: '',
  });
  const [showRejectModal, setShowRejectModal] = useState<{ visible: boolean; returnId: string | null }>({
    visible: false,
    returnId: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRefundWithoutReturn, setShowRefundWithoutReturn] = useState<{ visible: boolean; record: ReturnRequestResponse | null }>({
    visible: false,
    record: null,
  });
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [productCache, setProductCache] = useState<Map<string, { image?: string; variantOptionName?: string; variantOptionValue?: string; variantUrl?: string }>>(new Map());

  // Load product details for all return requests
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = Array.from(new Set(data.map(item => item.productId)));
      const missingIds = productIds.filter(id => !productCache.has(id));
      
      if (missingIds.length === 0) return;

      try {
        const productDetails = await Promise.all(
          missingIds.map(async (productId) => {
            try {
              const response = await ProductListService.getProductById(productId);
              const product = response.data;
              return {
                productId,
                image: product.images?.[0] || undefined,
                variantOptionName: undefined, // Will be loaded from order item if needed
                variantOptionValue: undefined,
                variantUrl: undefined,
              };
            } catch (error) {
              console.error(`Failed to load product ${productId}:`, error);
              return {
                productId,
                image: undefined,
                variantOptionName: undefined,
                variantOptionValue: undefined,
                variantUrl: undefined,
              };
            }
          })
        );

        const newCache = new Map(productCache);
        productDetails.forEach(detail => {
          newCache.set(detail.productId, {
            image: detail.image,
            variantOptionName: detail.variantOptionName,
            variantOptionValue: detail.variantOptionValue,
            variantUrl: detail.variantUrl,
          });
        });
        setProductCache(newCache);
      } catch (error) {
        console.error('Error loading product details:', error);
      }
    };

    if (data.length > 0) {
      loadProductDetails();
    }
  }, [data, productCache]);

  // Helper function to get product image from cache
  const getProductImage = (record: ReturnRequestResponse): string | undefined => {
    const cached = productCache.get(record.productId);
    return cached?.image || cached?.variantUrl || undefined;
  };

  // Helper function to get variant label from cache
  const getVariantLabel = (record: ReturnRequestResponse): string | undefined => {
    const cached = productCache.get(record.productId);
    if (cached?.variantOptionName && cached?.variantOptionValue) {
      return `${cached.variantOptionName}: ${cached.variantOptionValue}`;
    }
    return undefined;
  };

  const handleApprove = async (record: ReturnRequestResponse) => {
    try {
      setApprovingId(record.id);
      await StoreReturnService.approve(record.id);
      message.success('Đã duyệt yêu cầu hoàn trả');
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể duyệt yêu cầu hoàn trả');
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenRejectModal = (record: ReturnRequestResponse) => {
    setShowRejectModal({ visible: true, returnId: record.id });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!showRejectModal.returnId) {
      message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
      return;
    }

    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setRejectingId(showRejectModal.returnId);
      await StoreReturnService.reject(showRejectModal.returnId, rejectReason.trim());
      message.success('Đã từ chối yêu cầu hoàn trả');
      setShowRejectModal({ visible: false, returnId: null });
      setRejectReason('');
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể từ chối yêu cầu hoàn trả');
    } finally {
      setRejectingId(null);
    }
  };

  const handleOpenPickShiftModal = (record: ReturnRequestResponse) => {
    setSelectedReturn(record);
    setPickShiftModalOpen(true);
  };

  const handleConfirmPickShift = async (shiftId: number) => {
    if (!selectedReturn) {
      message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
      return;
    }

    try {
      setPickShiftLoading(true);
      const response = await StoreReturnService.createGhnOrder(selectedReturn.id, shiftId);
      
      if (response.ghnOrderCode) {
        message.success(`Đã tạo đơn GHN thành công. Mã đơn: ${response.ghnOrderCode}`);
      } else {
        message.success('Đã xác nhận ca lấy hàng thành công');
      }
      
      setPickShiftModalOpen(false);
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể tạo đơn GHN');
    } finally {
      setPickShiftLoading(false);
    }
  };

  const hasPackageInfo = (record: ReturnRequestResponse): boolean => {
    return (
      record.status === 'APPROVED' &&
      record.packageWeight != null &&
      record.packageLength != null &&
      record.packageWidth != null &&
      record.packageHeight != null &&
      record.shippingFee != null
    );
  };

  const handleCancelGhnOrder = async () => {
    const trimmed = cancelOrderCode.trim();
    if (!trimmed) {
      message.error('Vui lòng nhập mã đơn hàng GHN');
      return;
    }

    try {
      setIsCancelling(true);
      await GhnService.cancelOrder([trimmed]);
      message.success('Đã gửi yêu cầu hủy đơn GHN');
      setShowCancelModal(false);
      setCancelOrderCode('');
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể hủy đơn GHN');
    } finally {
      setIsCancelling(false);
    }
  };
  const columns: ColumnsType<ReturnRequestResponse> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 280,
      render: (value: string, record: ReturnRequestResponse) => {
        const productImage = getProductImage(record);
        const variantLabel = getVariantLabel(record);
        
        return (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
              {productImage ? (
                <img
                  src={productImage}
                  alt={value}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-gray-100');
                  }}
                />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Text strong className="block text-sm leading-tight">{value}</Text>
              {variantLabel && (
                <Text type="secondary" className="text-xs mt-1 block">
                  {variantLabel}
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Giá hoàn trả',
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      width: 150,
      align: 'right',
      render: (value: number) => <Text>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Loại lý do',
      dataIndex: 'reasonType',
      key: 'reasonType',
      width: 180,
      render: (value: string) => (
        <Tag color={value === 'SHOP_FAULT' ? 'red' : 'default'}>
          {reasonTypeLabel[value] || value}
        </Tag>
      ),
    },
    {
      title: 'Lý do chi tiết',
      dataIndex: 'reason',
      key: 'reason',
      width: 220,
      render: (value: string) => (
        <Text className="text-xs">{value}</Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (_: string, record: ReturnRequestResponse) => {
        const isAutoApproved = record.status === 'APPROVED' && record.autoApproved;
        const isCancelled = record.status === 'CANCELLED';
        const isAutoRefunded = record.status === 'AUTO_REFUNDED';
        // Case 4.4: GHN không pickup sau 48h
        // Chỉ áp dụng khi đã từng có GHN order (status = SHIPPING) nhưng bị reset về APPROVED
        // Dấu hiệu: status = APPROVED, có package info, không có ghnOrderCode, 
        // và trackingStatus có thể là null (đã bị clear) hoặc 'ready_to_pick' (vẫn chờ lấy)
        // Để phân biệt với trường hợp mới có package info: check nếu updatedAt cách xa hơn 5 phút
        const hasPackageInfoForGhn = hasPackageInfo(record) && record.shippingFee != null;
        const isGhnTimeoutCase = 
          record.status === 'APPROVED' &&
          hasPackageInfoForGhn &&
          !record.ghnOrderCode &&
          (record.trackingStatus === null || record.trackingStatus === 'ready_to_pick');
        // Check updatedAt để đảm bảo đây là trường hợp đã từng có GHN order (ít nhất 5 phút trước)
        const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const needsRecreateGhn = isGhnTimeoutCase && updatedAt && updatedAt <= fiveMinutesAgo;
        const isShippingDelivered = record.status === 'SHIPPING' && record.trackingStatus === 'delivered';
        const label = isAutoApproved
          ? 'Đã duyệt (tự động)'
          : isCancelled
            ? 'Đã huỷ (khách không gửi hàng)'
            : isAutoRefunded
              ? 'AUTO REFUND – Hệ thống hoàn tiền'
              : statusLabelMap[record.status] || record.status;
        return (
          <Space direction="vertical" size={4}>
            <Tag color={statusColorMap[record.status] || 'default'}>
              {label}
            </Tag>
            {record.status === 'PENDING' && (
              <Text type="secondary" className="text-xs">
                Yêu cầu mới – Chờ xử lý
              </Text>
            )}
            {record.status === 'SHIPPING' && record.trackingStatus === 'delivered' && (
              <Text type="secondary" className="text-xs text-orange-600">
                Hàng trả đã giao tới shop. Bạn có 48 giờ để xử lý: xác nhận hoàn tiền nếu đúng, hoặc khiếu nại nếu sai. Nếu không xử lý, hệ thống sẽ tự hoàn tiền sản phẩm.
              </Text>
            )}
            {isAutoApproved && (
              <Text type="secondary" className="text-xs">
                Yêu cầu đã được hệ thống tự duyệt do quá 48 giờ không phản hồi.
              </Text>
            )}
            {isCancelled && (
              <Text type="secondary" className="text-xs">
                Khách không gửi hàng – yêu cầu đã bị huỷ tự động.
              </Text>
            )}
            {isAutoRefunded && (
              <Text type="secondary" className="text-xs">
                Hệ thống đã tự hoàn tiền do shop không xử lý trong thời hạn.
              </Text>
            )}
            {isShippingDelivered && (
              <Text type="secondary" className="text-xs text-orange-600">
                Hàng trả đã giao tới shop. Bạn có 48 giờ để xử lý: nếu hàng đúng mô tả → xác nhận hoàn tiền; nếu sai → khiếu nại. Quá 48 giờ hệ thống sẽ tự hoàn tiền sản phẩm.
              </Text>
            )}
            {needsRecreateGhn && (
              <Text type="secondary" className="text-xs">
                GHN không lấy hàng, vui lòng tạo lại đơn GHN.
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Hình ảnh / Video',
      key: 'media',
      width: 260,
      render: (_: any, record: ReturnRequestResponse) => {
        const rawImages = Array.isArray(record.customerImageUrls)
          ? record.customerImageUrls.filter(Boolean)
          : [];
        const filteredImages = rawImages.filter((url) => url !== 'string');
        const rawVideo = record.customerVideoUrl || '';
        const hasRealImages = filteredImages.length > 0;
        const hasRealVideo = rawVideo && rawVideo !== 'string';

        if (!hasRealImages && !hasRealVideo) {
          return <Text type="secondary" className="text-xs">Không cung cấp</Text>;
        }

        return (
          <div className="space-y-3">
            {hasRealImages && (
              <div className="space-y-2">
                <Text className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" />
                  Ảnh ({filteredImages.length})
                </Text>
                <div className="grid grid-cols-3 gap-2">
                  {filteredImages.slice(0, 3).map((url, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all shadow-sm hover:shadow-md cursor-pointer"
                      onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: index })}
                    >
                      <img
                        src={url}
                        alt={`Return image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {index === 2 && filteredImages.length > 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Text className="text-white font-semibold text-sm">+{filteredImages.length - 3}</Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasRealVideo && (
              <div className="space-y-2">
                <Text className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <VideoIcon className="w-3 h-3" />
                  Video
                </Text>
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all shadow-sm hover:shadow-md cursor-pointer group"
                  onClick={() => setVideoPreview({ visible: true, url: rawVideo })}
                >
                  <video
                    src={rawVideo}
                    className="w-full h-32 object-cover"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  >
                    Trình duyệt không hỗ trợ video
                  </video>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <VideoIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Thông tin gói hàng',
      key: 'packageInfo',
      width: 260,
      render: (_: any, record: ReturnRequestResponse) => {
        const hasPackageInfo =
          record.packageWeight != null &&
          record.packageLength != null &&
          record.packageWidth != null &&
          record.packageHeight != null &&
          record.shippingFee != null;

        if (!hasPackageInfo) {
          return <Text type="secondary" className="text-xs">Chưa có thông tin gói hàng</Text>;
        }

        return (
          <Space direction="vertical" size={2} className="text-xs">
            <Text>
              Khối lượng: <Text strong>{record.packageWeight} kg</Text>
            </Text>
            <Text>
              Kích thước:{' '}
              <Text strong>
                {record.packageLength} x {record.packageWidth} x {record.packageHeight} cm
              </Text>
            </Text>
            <Text>
              Phí vận chuyển:{' '}
              <Text strong>{formatCurrency(record.shippingFee || 0)}</Text>
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'GHN / Tracking',
      key: 'shippingInfo',
      width: 220,
      render: (_: any, record: ReturnRequestResponse) => {
        const hasOrderCode = !!record.ghnOrderCode;
        const hasTracking = !!record.trackingStatus;
        const isWaitingForSync = record.status === 'SHIPPING' && record.trackingStatus === 'CREATED_WAITING_SYNC';

        if (!hasOrderCode && !hasTracking) {
          return <Text type="secondary" className="text-xs">Chưa tạo đơn hoàn</Text>;
        }

        return (
          <Space direction="vertical" size={2} className="text-xs">
            {hasOrderCode && (
              <>
                <Text>
                  Mã GHN: <Text strong>{record.ghnOrderCode}</Text>
                </Text>
                {isWaitingForSync && (
                  <Text type="secondary" className="text-xs text-orange-600">
                    ⏳ Đang chờ đồng bộ từ GHN...
                  </Text>
                )}
                <Button
                  type="link"
                  size="small"
                  className="!p-0"
                  onClick={() => {
                    const url = `https://donhang.ghn.vn/?order_code=${encodeURIComponent(
                      record.ghnOrderCode || ''
                    )}`;
                    window.open(url, '_blank');
                  }}
                  disabled={isWaitingForSync}
                  title={isWaitingForSync ? 'Đang chờ đồng bộ từ GHN' : undefined}
                >
                  Theo dõi đơn
                </Button>
              </>
            )}
            {hasTracking && (
              <Text>
                Trạng thái: <Text strong>{trackingStatusLabelMap[record.trackingStatus || ''] || record.trackingStatus}</Text>
                {isWaitingForSync && (
                  <Text type="secondary" className="text-xs block mt-1">
                    (Đang chờ đồng bộ)
                  </Text>
                )}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => <Text>{formatDate(value)}</Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      render: (_: any, record: ReturnRequestResponse) => {
        const canRefundWithoutReturn =
          record.status === 'PENDING' && !record.ghnOrderCode;
        if (record.status === 'PENDING') {
          return (
            <Space direction="vertical" size={8} className="w-full">
              {canRefundWithoutReturn && (
                <Button
                  type="primary"
                  size="small"
                  className="w-full"
                  onClick={() => setShowRefundWithoutReturn({ visible: true, record })}
                  loading={refundingId === record.id}
                  disabled={approvingId === record.id || rejectingId === record.id}
                >
                  Hoàn tiền không cần trả hàng
                </Button>
              )}
              <Button
                type="primary"
                size="small"
                loading={approvingId === record.id}
                onClick={() => handleApprove(record)}
                className="w-full"
                disabled={rejectingId === record.id}
              >
                Duyệt hoàn trả
              </Button>
              <Button
                danger
                size="small"
                icon={<X className="w-3 h-3" />}
                loading={rejectingId === record.id}
                onClick={() => handleOpenRejectModal(record)}
                className="w-full"
                disabled={approvingId === record.id}
              >
                Không cho hoàn trả
              </Button>
            </Space>
          );
        }

        const isAutoApproved = record.status === 'APPROVED' && record.autoApproved;
        const isCancelled = record.status === 'CANCELLED';
        const isAutoRefunded = record.status === 'AUTO_REFUNDED';
        // Case 4.4: GHN không pickup sau 48h
        // Chỉ áp dụng khi đã từng có GHN order (status = SHIPPING) nhưng bị reset về APPROVED
        // Dấu hiệu: status = APPROVED, có package info, không có ghnOrderCode, 
        // và trackingStatus có thể là null (đã bị clear) hoặc 'ready_to_pick' (vẫn chờ lấy)
        // Để phân biệt với trường hợp mới có package info: check nếu updatedAt cách xa hơn 5 phút
        const hasPackageInfoForGhn = hasPackageInfo(record) && record.shippingFee != null;
        const isGhnTimeoutCase = 
          record.status === 'APPROVED' &&
          hasPackageInfoForGhn &&
          !record.ghnOrderCode &&
          (record.trackingStatus === null || record.trackingStatus === 'ready_to_pick');
        // Check updatedAt để đảm bảo đây là trường hợp đã từng có GHN order (ít nhất 5 phút trước)
        const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const needsRecreateGhn = isGhnTimeoutCase && updatedAt && updatedAt <= fiveMinutesAgo;
        const isShippingDelivered = record.status === 'SHIPPING' && record.trackingStatus === 'delivered';

        if (isAutoRefunded) {
          return (
            <Text type="secondary" className="text-xs">
              AUTO REFUND – Hệ thống đã hoàn tiền do shop không xử lý trong 48 giờ sau khi nhận. Không thể khiếu nại/nhận hàng nữa.
            </Text>
          );
        }

        if (isShippingDelivered) {
          // Check if waiting for GHN sync: status == SHIPPING && trackingStatus == "CREATED_WAITING_SYNC"
          const isWaitingForSync = record.status === 'SHIPPING' && record.trackingStatus === 'CREATED_WAITING_SYNC';
          // Disable buttons if waiting for sync
          const canTakeAction = !isWaitingForSync;

          return (
            <Space direction="vertical" size={6} className="w-full">
              {isWaitingForSync && (
                <Text type="secondary" className="text-xs text-orange-600">
                  Đang chờ đồng bộ từ GHN. Vui lòng đợi trong giây lát...
                </Text>
              )}
              {!isWaitingForSync && (
                <Text type="secondary" className="text-xs text-orange-600">
                  Hàng trả đã giao tới shop. Bạn có 48 giờ để xử lý: xác nhận hoàn tiền nếu đúng, hoặc khiếu nại nếu sai. Nếu không xử lý, hệ thống sẽ tự hoàn tiền sản phẩm.
                </Text>
              )}
              <Space className="w-full">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApprove(record)}
                  disabled={!canTakeAction || rejectingId === record.id || approvingId === record.id}
                  title={isWaitingForSync ? 'Đang chờ đồng bộ từ GHN' : undefined}
                >
                  Xác nhận nhận đúng hàng & hoàn tiền
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleOpenRejectModal(record)}
                  disabled={!canTakeAction || approvingId === record.id || rejectingId === record.id}
                  title={isWaitingForSync ? 'Đang chờ đồng bộ từ GHN' : undefined}
                >
                  Khiếu nại hàng trả
                </Button>
              </Space>
              {!isWaitingForSync && (
                <Text type="secondary" className="text-xs">
                  Nếu không xử lý trong 48 giờ, hệ thống sẽ tự động hoàn tiền sản phẩm cho khách (không hoàn phí trả hàng).
                </Text>
              )}
            </Space>
          );
        }

        if (isCancelled) {
          return (
            <Text type="secondary" className="text-xs">
              Khách không gửi hàng – yêu cầu đã bị huỷ tự động.
            </Text>
          );
        }

        if (hasPackageInfo(record)) {
          // Check if waiting for GHN sync: status == SHIPPING && trackingStatus == "CREATED_WAITING_SYNC"
          const isWaitingForSync = record.status === 'SHIPPING' && record.trackingStatus === 'CREATED_WAITING_SYNC';
          // Disable if already has ghnOrderCode (should not create again)
          const hasGhnOrderCode = !!record.ghnOrderCode;
          // Disable create GHN button if waiting for sync or already has order code
          const canCreateGhn = !isWaitingForSync && !hasGhnOrderCode;

          return (
            <Space direction="vertical" size={6} className="w-full">
              {isAutoApproved && (
                <Text type="secondary" className="text-xs">
                  Yêu cầu đã được hệ thống auto-approve, không thể chấp nhận/từ chối.
                </Text>
              )}
              {isWaitingForSync && (
                <Text type="secondary" className="text-xs text-orange-600">
                  Đang chờ đồng bộ từ GHN. Vui lòng đợi trong giây lát...
                </Text>
              )}
              {hasGhnOrderCode && !isWaitingForSync && (
                <Text type="secondary" className="text-xs text-green-600">
                  Đã tạo đơn GHN: {record.ghnOrderCode}
                </Text>
              )}
              {needsRecreateGhn && (
                <Text type="secondary" className="text-xs text-orange-600">
                  GHN không lấy hàng, vui lòng tạo lại đơn GHN.
                </Text>
              )}
              <Button
                type="default"
                size="small"
                onClick={() => handleOpenPickShiftModal(record)}
                disabled={!canCreateGhn}
                title={!canCreateGhn ? (isWaitingForSync ? 'Đang chờ đồng bộ từ GHN' : 'Đã có đơn GHN') : undefined}
              >
                {needsRecreateGhn ? 'Tạo lại đơn GHN trả hàng' : 'Xác nhận ca lấy hàng'}
              </Button>
              {/* Show cancel GHN button and track order link when has GHN order code */}
              {hasGhnOrderCode && (
                <>
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !h-auto"
                    onClick={() => {
                      const url = `https://donhang.ghn.vn/?order_code=${encodeURIComponent(
                        record.ghnOrderCode || ''
                      )}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Theo dõi đơn
                  </Button>
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      setCancelOrderCode(record.ghnOrderCode || '');
                      setShowCancelModal(true);
                    }}
                    className="w-full"
                  >
                    Hủy đơn GHN
                  </Button>
                </>
              )}
            </Space>
          );
        }

        if (record.status === 'APPROVED' && isAutoApproved) {
          return (
            <Text type="secondary" className="text-xs">
              Yêu cầu auto-approve, không thể thay đổi. Chờ shop tạo đơn GHN sau khi có thông tin gói hàng.
            </Text>
          );
        }

        return <Text type="secondary">—</Text>;
      },
    },
  ];

  return (
    <Card
      className="border-gray-200 shadow-sm"
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 24 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Yêu cầu hoàn trả sản phẩm
          </Title>
          <Text type="secondary">
            Quản lý các yêu cầu hoàn trả từ khách hàng
          </Text>
          <div className="mt-2">
            <Button
              danger
              size="small"
              onClick={() => {
                setCancelOrderCode('');
                setShowCancelModal(true);
              }}
            >
              Hủy đơn GHN
            </Button>
          </div>
        </div>
        <Space direction="vertical" size={0} className="text-right">
          <Text type="secondary" className="text-xs">
            Tổng số yêu cầu
          </Text>
          <Text strong>{total}</Text>
        </Space>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải danh sách yêu cầu hoàn trả...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <Empty description="Chưa có yêu cầu hoàn trả nào" />
        </div>
      ) : (
        <>
          <Table<ReturnRequestResponse>
            rowKey="id"
            columns={[
              {
                title: 'STT',
                key: 'index',
                width: 70,
                align: 'center',
                render: (_: any, __: ReturnRequestResponse, index: number) => (
                  <Text>{(page - 1) * pageSize + index + 1}</Text>
                ),
              },
              ...columns.map((col) =>
                col.key === 'productName'
                  ? {
                      ...col,
                      width: 230,
                    }
                  : col
              ),
            ]}
            dataSource={data}
            pagination={false}
            scroll={{ x: 1300 }}
          />
          <div className="mt-4 flex justify-end">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={['5', '10', '20', '50']}
              onChange={onPageChange}
              showTotal={(t) => `Tổng ${t} yêu cầu`}
            />
          </div>
        </>
      )}

      <PickShiftModal
        open={pickShiftModalOpen}
        onCancel={() => setPickShiftModalOpen(false)}
        onSubmit={handleConfirmPickShift}
        loading={pickShiftLoading}
      />

      {/* Image Preview Modal */}
      <Modal
        open={imagePreview.visible}
        onCancel={() => setImagePreview({ visible: false, urls: [], current: 0 })}
        footer={null}
        width="90vw"
        style={{ maxWidth: '1200px' }}
        centered
        className="image-preview-modal"
      >
        <div className="relative">
          <img
            src={imagePreview.urls[imagePreview.current]}
            alt={`Image ${imagePreview.current + 1}`}
            className="w-full rounded-lg"
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
          {imagePreview.urls.length > 1 && (
            <>
              <Button
                type="default"
                shape="circle"
                icon={<span>‹</span>}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                onClick={() =>
                  setImagePreview((prev) => ({
                    ...prev,
                    current: (prev.current - 1 + prev.urls.length) % prev.urls.length,
                  }))
                }
              />
              <Button
                type="default"
                shape="circle"
                icon={<span>›</span>}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                onClick={() =>
                  setImagePreview((prev) => ({
                    ...prev,
                    current: (prev.current + 1) % prev.urls.length,
                  }))
                }
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {imagePreview.current + 1} / {imagePreview.urls.length}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        open={videoPreview.visible}
        onCancel={() => setVideoPreview({ visible: false, url: '' })}
        footer={null}
        width="90vw"
        style={{ maxWidth: '800px' }}
        centered
      >
        <video
          src={videoPreview.url}
          controls
          autoPlay
          className="w-full rounded-lg"
          style={{ maxHeight: '70vh' }}
        >
          Trình duyệt không hỗ trợ video
        </video>
      </Modal>

      {/* Reject Return Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <span>Từ chối yêu cầu hoàn trả</span>
          </div>
        }
        open={showRejectModal.visible}
        onCancel={() => {
          setShowRejectModal({ visible: false, returnId: null });
          setRejectReason('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu hoàn trả..."
              rows={4}
              maxLength={500}
              showCount
              disabled={!!rejectingId}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lý do này sẽ được gửi đến khách hàng để giải thích việc từ chối yêu cầu hoàn trả.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowRejectModal({ visible: false, returnId: null });
                setRejectReason('');
              }}
              disabled={!!rejectingId}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              icon={<X className="w-4 h-4" />}
              onClick={handleReject}
              disabled={!!rejectingId || !rejectReason.trim()}
              loading={!!rejectingId}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Hủy đơn hàng GHN"
        open={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelOrderCode('');
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã đơn hàng GHN *
            </label>
            <Input
              value={cancelOrderCode}
              onChange={(e) => setCancelOrderCode(e.target.value)}
              placeholder="Nhập mã đơn hàng GHN (ví dụ: GYNP9EWK)"
              disabled={isCancelling}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập mã đơn hàng GHN mà bạn muốn hủy.
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
              Đóng
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleCancelGhnOrder}
              disabled={isCancelling || !cancelOrderCode.trim()}
              loading={isCancelling}
            >
              Xác nhận hủy GHN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Refund Without Return Modal */}
      <Modal
        title="Xác nhận hoàn tiền không cần trả hàng?"
        open={showRefundWithoutReturn.visible}
        onCancel={() => {
          if (refundingId) return;
          setShowRefundWithoutReturn({ visible: false, record: null });
        }}
        footer={null}
        width={500}
      >
        {showRefundWithoutReturn.record && (
          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <Text strong>Số tiền hoàn cho khách: {formatCurrency(showRefundWithoutReturn.record.itemPrice)}</Text>
              <Text type="secondary">
                Không tạo đơn GHN, khách không cần gửi lại hàng.
              </Text>
              <Text type="secondary">
                Lưu ý: Phí vận chuyển ban đầu sẽ không được hoàn.
              </Text>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setShowRefundWithoutReturn({ visible: false, record: null })}
                disabled={!!refundingId}
              >
                Huỷ
              </Button>
              <Button
                type="primary"
                loading={!!refundingId}
                onClick={async () => {
                  if (!showRefundWithoutReturn.record) return;
                  try {
                    setRefundingId(showRefundWithoutReturn.record.id);
                    await StoreReturnService.refundWithoutReturn(showRefundWithoutReturn.record.id);
                    message.success('Hoàn tiền thành công. Khách không cần gửi lại hàng.');
                    setShowRefundWithoutReturn({ visible: false, record: null });
                    onReload?.();
                  } catch (e: any) {
                    message.error(e?.message || 'Có lỗi xảy ra khi hoàn tiền. Vui lòng thử lại.');
                  } finally {
                    setRefundingId(null);
                  }
                }}
              >
                Xác nhận hoàn tiền
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default StoreReturnList;


