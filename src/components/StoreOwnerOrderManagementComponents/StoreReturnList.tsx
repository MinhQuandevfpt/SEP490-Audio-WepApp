import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Tag, Typography, Space, Pagination, Empty, Spin, Button, message, Modal, Input } from 'antd';
import { ZoomIn, Video as VideoIcon, X, Package, AlertTriangle, Upload, Image as ImageIcon, Calendar, DollarSign, Truck, Box, User, Store } from 'lucide-react';
import type { ReturnRequestResponse } from '../../types/api';
import { formatDate, formatCurrency } from '../../utils/orderStatus';
import { StoreReturnService } from '../../services/seller/StoreReturnService';
import PickShiftModal from './PickShiftModal';
import { GhnService } from '../../services/seller/GhnService';
import { ProductListService } from '../../services/customer/ProductListService';
import { FileUploadService } from '../../services/FileUploadService';

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
  highlightReturnId?: string | null;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  CANCELED: 'gray',
  AUTO_REFUNDED: 'gray',
  SHIPPING: 'blue',
  DELIVERED: 'orange',
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
  DELIVERED: 'Đã giao tới shop – Chờ xác nhận',
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
  highlightReturnId,
}) => {
  const highlightedCardRef = useRef<HTMLDivElement | null>(null);
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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showRefundWithoutReturn, setShowRefundWithoutReturn] = useState<{ visible: boolean; record: ReturnRequestResponse | null }>({
    visible: false,
    record: null,
  });
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [productCache, setProductCache] = useState<Map<string, { image?: string; variantOptionName?: string; variantOptionValue?: string; variantUrl?: string }>>(new Map());
  const [showDisputeModal, setShowDisputeModal] = useState<{ visible: boolean; returnId: string | null }>({
    visible: false,
    returnId: null,
  });
  const [disputeReason, setDisputeReason] = useState('');
  const [disputingId, setDisputingId] = useState<string | null>(null);
  // Use objects with unique IDs instead of File[] to avoid index-based key issues
  type DisputeImageFile = {
    id: string;
    file: File;
  };
  const [disputeImageFiles, setDisputeImageFiles] = useState<DisputeImageFile[]>([]);
  const [disputeVideoFile, setDisputeVideoFile] = useState<File | null>(null);
  const [isUploadingDisputeMedia, setIsUploadingDisputeMedia] = useState(false);
  // Track object URLs for memory cleanup - use Map with unique IDs as keys
  const disputeImageUrlsRef = useRef<Map<string, string>>(new Map());
  const disputeVideoUrlRef = useRef<string | null>(null);

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

  const handleConfirmReceived = async (record: ReturnRequestResponse) => {
    try {
      setConfirmingId(record.id);
      await StoreReturnService.shopConfirmReceived(record.id);
      message.success('Đã xác nhận nhận hàng trả về');
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleOpenConfirmReceivedModal = (record: ReturnRequestResponse) => {
    Modal.confirm({
      title: 'Xác nhận đã nhận hàng trả về',
      content: (
        <div className="space-y-2">
          <p>Bạn có chắc chắn đã nhận được hàng trả về từ khách hàng?</p>
          <p className="text-sm text-gray-600">
            <strong>Lưu ý:</strong> Sau khi xác nhận, hệ thống sẽ tiến hành hoàn tiền cho khách hàng.
          </p>
        </div>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: { danger: false },
      onOk: async () => {
        await handleConfirmReceived(record);
      },
    });
  };

  const handleOpenRejectModal = (record: ReturnRequestResponse) => {
    setShowRejectModal({ visible: true, returnId: record.id });
    setRejectReason('');
  };

  const handleOpenDisputeModal = (record: ReturnRequestResponse) => {
    setShowDisputeModal({ visible: true, returnId: record.id });
    setDisputeReason('');
    setDisputeImageFiles([]);
    setDisputeVideoFile(null);
    // Clear and revoke any existing URLs when opening the modal
    disputeImageUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    disputeImageUrlsRef.current.clear();
    if (disputeVideoUrlRef.current) {
      URL.revokeObjectURL(disputeVideoUrlRef.current);
      disputeVideoUrlRef.current = null;
    }
  };

  const handleDisputeFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (type === 'image') {
      const maxFiles = 5;
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      if (disputeImageFiles.length + files.length > maxFiles) {
        message.error(`Chỉ được tải tối đa ${maxFiles} ảnh`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of files) {
        const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          message.error(`${file.name}: ${validation.error}`);
        }
      }

      setDisputeImageFiles(prev => {
        // Create unique IDs for new files and object URLs
        const newFilesWithIds: DisputeImageFile[] = validFiles.map(file => {
          const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const url = URL.createObjectURL(file);
          disputeImageUrlsRef.current.set(id, url);
          return { id, file };
        });
        return [...prev, ...newFilesWithIds];
      });
    } else if (type === 'video') {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

      if (files.length > 1) {
        message.error('Chỉ được tải 1 video');
        return;
      }

      const file = files[0];
      const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
      if (validation.isValid) {
        // Revoke previous video URL if exists
        if (disputeVideoUrlRef.current) {
          URL.revokeObjectURL(disputeVideoUrlRef.current);
        }
        // Create new object URL
        disputeVideoUrlRef.current = URL.createObjectURL(file);
        setDisputeVideoFile(file);
      } else {
        message.error(`${file.name}: ${validation.error}`);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const removeDisputeImage = (fileId: string) => {
    setDisputeImageFiles(prev => {
      // Revoke object URL for removed file
      const url = disputeImageUrlsRef.current.get(fileId);
      if (url) {
        URL.revokeObjectURL(url);
        disputeImageUrlsRef.current.delete(fileId);
      }
      return prev.filter(item => item.id !== fileId);
    });
  };

  const removeDisputeVideo = () => {
    // Revoke object URL before clearing video file
    if (disputeVideoUrlRef.current) {
      URL.revokeObjectURL(disputeVideoUrlRef.current);
      disputeVideoUrlRef.current = null;
    }
    setDisputeVideoFile(null);
  };

  // Cleanup object URLs when modal closes or component unmounts
  useEffect(() => {
    return () => {
      // Revoke all image URLs
      disputeImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      disputeImageUrlsRef.current.clear();
      // Revoke video URL
      if (disputeVideoUrlRef.current) {
        URL.revokeObjectURL(disputeVideoUrlRef.current);
        disputeVideoUrlRef.current = null;
      }
    };
  }, []);

  // Cleanup when dispute modal closes
  useEffect(() => {
    if (!showDisputeModal.visible) {
      // Revoke all image URLs
      disputeImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      disputeImageUrlsRef.current.clear();
      // Revoke video URL
      if (disputeVideoUrlRef.current) {
        URL.revokeObjectURL(disputeVideoUrlRef.current);
        disputeVideoUrlRef.current = null;
      }
    }
  }, [showDisputeModal.visible]);

  const handleDispute = async () => {
    if (!showDisputeModal.returnId) {
      message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
      return;
    }

    if (!disputeReason.trim()) {
      message.warning('Vui lòng nhập lý do khiếu nại');
      return;
    }

    try {
      setDisputingId(showDisputeModal.returnId);
      setIsUploadingDisputeMedia(true);

      // Upload images
      let imageUrls: string[] = [];
      if (disputeImageFiles.length > 0) {
        const uploadPromises = disputeImageFiles.map(item => FileUploadService.uploadImage(item.file));
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.url);
      }

      // Upload video
      let videoUrl: string | undefined;
      if (disputeVideoFile) {
        const videoResult = await FileUploadService.uploadVideo(disputeVideoFile);
        videoUrl = videoResult.url;
      }

      // Submit dispute
      await StoreReturnService.dispute(showDisputeModal.returnId, {
        reason: disputeReason.trim(),
        videoUrl: videoUrl,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      message.success('Đã gửi khiếu nại lên admin thành công. Admin sẽ xem xét và xử lý.');
      setShowDisputeModal({ visible: false, returnId: null });
      setDisputeReason('');
      setDisputeImageFiles([]);
      setDisputeVideoFile(null);
      // Revoke URLs after successful submission
      disputeImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      disputeImageUrlsRef.current.clear();
      if (disputeVideoUrlRef.current) {
        URL.revokeObjectURL(disputeVideoUrlRef.current);
        disputeVideoUrlRef.current = null;
      }
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể gửi khiếu nại. Vui lòng thử lại.');
    } finally {
      setDisputingId(null);
      setIsUploadingDisputeMedia(false);
    }
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

  // Render return request card
  const renderReturnCard = (record: ReturnRequestResponse, isHighlighted: boolean = false) => {
    const productImage = getProductImage(record);
    const variantLabel = getVariantLabel(record);
    const isAutoApproved = record.status === 'APPROVED' && record.autoApproved;
    const isCancelled = record.status === 'CANCELLED';
    const isAutoRefunded = record.status === 'AUTO_REFUNDED';
    const hasPackageInfoForGhn = hasPackageInfo(record) && record.shippingFee != null;
    const isGhnTimeoutCase = 
      record.status === 'APPROVED' &&
      hasPackageInfoForGhn &&
      !record.ghnOrderCode &&
      (record.trackingStatus === null || record.trackingStatus === 'ready_to_pick');
    const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const needsRecreateGhn = isGhnTimeoutCase && updatedAt && updatedAt <= fiveMinutesAgo;
    const isShippingDelivered = record.status === 'SHIPPING' && record.trackingStatus === 'delivered';
    const isWaitingForSync = record.status === 'SHIPPING' && record.trackingStatus === 'CREATED_WAITING_SYNC';
    
    const rawImages = Array.isArray(record.customerImageUrls)
      ? record.customerImageUrls.filter(Boolean)
      : [];
    const filteredImages = rawImages.filter((url) => url !== 'string');
    const rawVideo = record.customerVideoUrl || '';
    const hasRealImages = filteredImages.length > 0;
    const hasRealVideo = rawVideo && rawVideo !== 'string';

    const label = isAutoApproved
      ? 'Đã duyệt (tự động)'
      : isCancelled
        ? 'Đã huỷ (khách không gửi hàng)'
        : isAutoRefunded
          ? 'AUTO REFUND – Hệ thống hoàn tiền'
          : statusLabelMap[record.status] || record.status;

    const canRefundWithoutReturn = record.status === 'PENDING' && !record.ghnOrderCode;
    const hasGhnOrderCode = !!record.ghnOrderCode;
    const canCreateGhn = !isWaitingForSync && !hasGhnOrderCode;
    const canTakeAction = !isWaitingForSync;

    return (
      <Card
        key={record.id}
        className={`mb-4 hover:shadow-lg transition-shadow ${isHighlighted ? 'ring-4 ring-orange-400 ring-opacity-50' : ''}`}
        style={{ 
          borderRadius: 12,
          ...(isHighlighted ? { 
            borderColor: '#fb923c',
            borderWidth: 2,
            backgroundColor: '#fff7ed',
          } : {})
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Product Image & Basic Info */}
          <div className="flex-shrink-0 lg:w-32">
            <div className="mb-2">
              <Text type="secondary" className="text-xs font-medium">Hình ảnh sản phẩm</Text>
            </div>
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
              {productImage ? (
                <img
                  src={productImage}
                  alt={record.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-gray-100');
                  }}
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="mt-2">
              <Text strong className="block text-xs leading-tight">{record.productName}</Text>
              {variantLabel && (
                <Text type="secondary" className="text-xs mt-1 block">
                  {variantLabel}
                </Text>
              )}
            </div>
          </div>

          {/* Center: Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Status & Price Row */}
            <div className="space-y-1">
              <Text type="secondary" className="text-xs font-medium">Trạng thái & Giá trị đơn hàng</Text>
              <div className="flex flex-wrap items-center gap-3">
                <Tag color={statusColorMap[record.status] || 'default'} className="text-sm">
                  {label}
                </Tag>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <Text strong className="text-lg text-orange-600">
                    {formatCurrency(record.itemPrice)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Order Code */}
            {record.orderCode && (
              <div className="space-y-1">
                <Text type="secondary" className="text-xs font-medium">Mã đơn hàng</Text>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <Text className="font-mono text-sm font-semibold text-gray-900">{record.orderCode}</Text>
                </div>
              </div>
            )}

            {/* Reason Type & Detail */}
            <div className="space-y-1">
              <Text type="secondary" className="text-xs font-medium">Lý do hoàn trả</Text>
              <div className="flex items-center gap-2">
                <Tag color={record.reasonType === 'SHOP_FAULT' ? 'red' : 'default'} className="text-xs">
                  {reasonTypeLabel[record.reasonType] || record.reasonType}
                </Tag>
              </div>
              <Text className="text-sm text-gray-700">{record.reason}</Text>
            </div>

            {/* Customer & Store Info */}
            <div className="space-y-1">
              <Text type="secondary" className="text-xs font-medium">Thông tin khách hàng & cửa hàng</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {record.customerName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <Text type="secondary" className="text-xs">Khách hàng</Text>
                      <div className="font-medium">{record.customerName}</div>
                      {record.customerLegalPoint !== undefined && (
                        <Text type="secondary" className="text-xs">
                          Điểm uy tín: {record.customerLegalPoint}
                        </Text>
                      )}
                    </div>
                  </div>
                )}
                {record.storeName && (
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-500" />
                    <div>
                      <Text type="secondary" className="text-xs">Cửa hàng</Text>
                      <div className="font-medium">{record.storeName}</div>
                      {record.storeLegalPoint !== undefined && (
                        <Text type="secondary" className="text-xs">
                          Điểm uy tín: {record.storeLegalPoint}
                        </Text>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-2">
              <Text type="secondary" className="text-xs font-medium">Hình ảnh/video chứng minh từ khách hàng</Text>
              {(hasRealImages || hasRealVideo) ? (
                <>
                  {hasRealImages && (
                    <div className="space-y-1">
                      <Text className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" />
                        Ảnh khách hàng gửi ({filteredImages.length})
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Click vào ảnh để xem chi tiết
                      </Text>
                      <div className="flex gap-2 flex-wrap">
                        {filteredImages.slice(0, 3).map((url, idx) => (
                          <div
                            key={`${record.id}-img-${idx}`}
                            className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer"
                            onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: idx })}
                            title="Click để xem ảnh lớn"
                          >
                            <img
                              src={url}
                              alt={`Return image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {filteredImages.length > 3 && (
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-all"
                            onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: 2 })}
                            title={`Xem thêm ${filteredImages.length - 3} ảnh`}
                          >
                            <Text className="text-xs font-semibold">+{filteredImages.length - 3}</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {hasRealVideo && (
                    <div className="space-y-1">
                      <Text className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <VideoIcon className="w-3 h-3" />
                        Video khách hàng gửi
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Click vào video để xem chi tiết
                      </Text>
                      <div
                        className="w-24 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer relative"
                        onClick={() => setVideoPreview({ visible: true, url: rawVideo })}
                        title="Click để xem video"
                      >
                        <video
                          src={rawVideo}
                          className="w-full h-full object-cover"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <VideoIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Text type="secondary" className="text-xs text-gray-500 italic">
                  Khách hàng không cung cấp hình ảnh chứng minh
                </Text>
              )}
            </div>

            {/* Package Info */}
            {hasPackageInfo(record) && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-gray-500" />
                  <Text strong className="text-sm">Thông tin gói hàng</Text>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Text type="secondary">Khối lượng:</Text>
                    <Text strong className="ml-1">{record.packageWeight} kg</Text>
                  </div>
                  <div>
                    <Text type="secondary">Kích thước:</Text>
                    <Text strong className="ml-1">
                      {record.packageLength} x {record.packageWidth} x {record.packageHeight} cm
                    </Text>
                  </div>
                  <div className="col-span-2">
                    <Text type="secondary">Phí vận chuyển:</Text>
                    <Text strong className="ml-1">{formatCurrency(record.shippingFee || 0)}</Text>
                  </div>
                </div>
              </div>
            )}

            {/* GHN Tracking */}
            {(hasGhnOrderCode || record.trackingStatus) && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <Text strong className="text-sm">GHN / Tracking</Text>
                </div>
                {hasGhnOrderCode && (
                  <div className="space-y-1">
                    <div>
                      <Text type="secondary" className="text-xs">Mã GHN:</Text>
                      <Text strong className="ml-1">{record.ghnOrderCode}</Text>
                    </div>
                    <Button
                      type="link"
                      size="small"
                      className="!p-0 !h-auto"
                      onClick={() => {
                        const url = `https://donhang.ghn.vn/?order_code=${encodeURIComponent(record.ghnOrderCode || '')}`;
                        window.open(url, '_blank');
                      }}
                      disabled={isWaitingForSync}
                    >
                      Theo dõi đơn
                    </Button>
                  </div>
                )}
                {record.trackingStatus && record.trackingStatus !== 'CREATED_WAITING_SYNC' && (
                  <div>
                    <Text type="secondary" className="text-xs">Trạng thái:</Text>
                    <Text strong className="ml-1">
                      {trackingStatusLabelMap[record.trackingStatus || ''] || record.trackingStatus}
                    </Text>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {record.status === 'PENDING' && (
              <Text type="secondary" className="text-xs block">
                Yêu cầu mới – Chờ xử lý
              </Text>
            )}
            {isAutoApproved && (
              <Text type="secondary" className="text-xs block">
                Yêu cầu đã được hệ thống tự duyệt do quá 48 giờ không phản hồi.
              </Text>
            )}
            {isCancelled && (
              <Text type="secondary" className="text-xs block">
                Khách không gửi hàng – yêu cầu đã bị huỷ tự động.
              </Text>
            )}
            {isAutoRefunded && (
              <Text type="secondary" className="text-xs block">
                Hệ thống đã tự hoàn tiền do shop không xử lý trong thời hạn.
              </Text>
            )}
            {isShippingDelivered && (
              <Text type="secondary" className="text-xs text-orange-600 block">
                Hàng trả đã giao tới shop. Bạn có 48 giờ để xử lý: nếu hàng đúng mô tả → xác nhận hoàn tiền; nếu sai → khiếu nại. Quá 48 giờ hệ thống sẽ tự hoàn tiền sản phẩm.
              </Text>
            )}
            {needsRecreateGhn && (
              <Text type="secondary" className="text-xs text-orange-600 block">
                GHN không lấy hàng, vui lòng tạo lại đơn GHN.
              </Text>
            )}

            {/* Created Date */}
            <div className="space-y-1">
              <Text type="secondary" className="text-xs font-medium">Thời gian tạo yêu cầu</Text>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <Text type="secondary">{formatDate(record.createdAt)}</Text>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 lg:w-48">
            <div className="space-y-2">
              {/* Hide all buttons if finalDecision is true */}
              {!record.finalDecision && record.status === 'PENDING' && (
                <>
                  {canRefundWithoutReturn && (
                    <Button
                      type="primary"
                      size="small"
                      className="w-full"
                      onClick={() => setShowRefundWithoutReturn({ visible: true, record })}
                      loading={refundingId === record.id}
                      disabled={approvingId === record.id || rejectingId === record.id || disputingId === record.id}
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
                    disabled={rejectingId === record.id || disputingId === record.id}
                  >
                    Duyệt hoàn trả
                  </Button>
                  {/* Hide reject and dispute buttons if adminForcedContinue is true */}
                  {!record.adminForcedContinue && (
                    <>
                      <Button
                        danger
                        size="small"
                        icon={<X className="w-3 h-3" />}
                        loading={rejectingId === record.id}
                        onClick={() => handleOpenRejectModal(record)}
                        className="w-full"
                        disabled={approvingId === record.id || disputingId === record.id}
                      >
                        Không cho hoàn trả
                      </Button>
                      <Button
                        type="default"
                        size="small"
                        icon={<AlertTriangle className="w-3 h-3" />}
                        onClick={() => handleOpenDisputeModal(record)}
                        disabled={approvingId === record.id || rejectingId === record.id || disputingId === record.id}
                        className="w-full"
                      >
                        Khiếu nại lên admin
                      </Button>
                    </>
                  )}
                </>
              )}

              {isAutoRefunded && (
                <Text type="secondary" className="text-xs block">
                  AUTO REFUND – Hệ thống đã hoàn tiền do shop không xử lý trong 48 giờ sau khi nhận. Không thể khiếu nại/nhận hàng nữa.
                </Text>
              )}

              {!record.finalDecision && isShippingDelivered && (
                <>
                  <Text type="secondary" className="text-xs text-orange-600 block mb-2">
                    Hàng trả đã giao tới shop. Bạn có 48 giờ để xử lý.
                  </Text>
                  <Space direction="vertical" size={6} className="w-full">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleApprove(record)}
                      disabled={!canTakeAction || rejectingId === record.id || approvingId === record.id || disputingId === record.id}
                      className="w-full"
                    >
                      Xác nhận nhận đúng hàng & hoàn tiền
                    </Button>
                    {!record.adminForcedContinue && (
                      <>
                        <Button
                          danger
                          size="small"
                          onClick={() => handleOpenRejectModal(record)}
                          disabled={!canTakeAction || approvingId === record.id || rejectingId === record.id || disputingId === record.id}
                          className="w-full"
                        >
                          Khiếu nại hàng trả
                        </Button>
                        <Button
                          type="default"
                          size="small"
                          icon={<AlertTriangle className="w-3 h-3" />}
                          onClick={() => handleOpenDisputeModal(record)}
                          disabled={!canTakeAction || approvingId === record.id || rejectingId === record.id || disputingId === record.id}
                          className="w-full"
                        >
                          Khiếu nại lên admin
                        </Button>
                      </>
                    )}
                  </Space>
                </>
              )}

              {isCancelled && (
                <Text type="secondary" className="text-xs block">
                  Khách không gửi hàng – yêu cầu đã bị huỷ tự động.
                </Text>
              )}

              {!record.finalDecision && hasPackageInfo(record) && (
                <>
                  {isAutoApproved && (
                    <Text type="secondary" className="text-xs block mb-2">
                      Yêu cầu đã được hệ thống auto-approve, không thể chấp nhận/từ chối.
                    </Text>
                  )}
                  {hasGhnOrderCode && (
                    <Text type="secondary" className="text-xs text-green-600 block mb-2">
                      Đã tạo đơn GHN: {record.ghnOrderCode}
                    </Text>
                  )}
                  {needsRecreateGhn && (
                    <Text type="secondary" className="text-xs text-orange-600 block mb-2">
                      GHN không lấy hàng, vui lòng tạo lại đơn GHN.
                    </Text>
                  )}
                  <Button
                    type="default"
                    size="small"
                    onClick={() => handleOpenPickShiftModal(record)}
                    disabled={!canCreateGhn}
                    className="w-full mb-2"
                  >
                    {needsRecreateGhn ? 'Tạo lại đơn GHN trả hàng' : 'Xác nhận ca lấy hàng'}
                  </Button>
                  {hasGhnOrderCode && (
                    <>
                      <Button
                        type="link"
                        size="small"
                        className="!p-0 !h-auto w-full"
                        onClick={() => {
                          const url = `https://donhang.ghn.vn/?order_code=${encodeURIComponent(record.ghnOrderCode || '')}`;
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
                  {record.status === 'APPROVED' && !record.adminForcedContinue && (
                    <Button
                      type="default"
                      size="small"
                      icon={<AlertTriangle className="w-3 h-3" />}
                      onClick={() => handleOpenDisputeModal(record)}
                      disabled={disputingId === record.id}
                      className="w-full mt-2"
                    >
                      Khiếu nại lên admin
                    </Button>
                  )}
                </>
              )}

              {record.status === 'APPROVED' && isAutoApproved && !hasPackageInfo(record) && (
                <Text type="secondary" className="text-xs block">
                  Yêu cầu auto-approve, không thể thay đổi. Chờ shop tạo đơn GHN sau khi có thông tin gói hàng.
                </Text>
              )}

              {/* DELIVERED Status - Show confirm received and dispute buttons */}
              {!record.finalDecision && record.status === 'DELIVERED' && (
                <>
                  <Text type="secondary" className="text-xs text-orange-600 block mb-2">
                    Hàng trả đã được giao tới shop. Vui lòng xác nhận đã nhận hàng hoặc khiếu nại nếu có vấn đề.
                  </Text>
                  <Space direction="vertical" size={6} className="w-full">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleOpenConfirmReceivedModal(record)}
                      loading={confirmingId === record.id}
                      disabled={confirmingId === record.id || disputingId === record.id}
                      className="w-full"
                    >
                      Xác nhận đã nhận hàng
                    </Button>
                    {!record.adminForcedContinue && (
                      <Button
                        type="default"
                        size="small"
                        icon={<AlertTriangle className="w-3 h-3" />}
                        onClick={() => handleOpenDisputeModal(record)}
                        disabled={confirmingId === record.id || disputingId === record.id}
                        className="w-full"
                      >
                        Khiếu nại lên admin
                      </Button>
                    )}
                  </Space>
                </>
              )}

              {!record.finalDecision && record.status === 'DISPUTE' && (
                <Text type="secondary" className="text-xs block">
                  Đang khiếu nại. Khiếu nại đã được gửi lên admin và đang chờ xử lý.
                </Text>
              )}

              {!['PENDING', 'SHIPPING', 'APPROVED', 'DISPUTE'].includes(record.status) && !isCancelled && !isAutoRefunded && !hasPackageInfo(record) && (
                <Text type="secondary" className="text-xs">—</Text>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Bubble sort function to sort by updatedAt (most recent first)
  const bubbleSortByDate = (arr: ReturnRequestResponse[]): ReturnRequestResponse[] => {
    const sorted = [...arr]; // Create a copy to avoid mutating the original array
    const n = sorted.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Get dates: prefer updatedAt, fallback to createdAt
        const dateA = sorted[j].updatedAt || sorted[j].createdAt;
        const dateB = sorted[j + 1].updatedAt || sorted[j + 1].createdAt;
        
        // Parse dates
        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;
        
        // Sort in descending order (most recent first)
        if (timeA < timeB) {
          // Swap elements
          const temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
        }
      }
    }
    
    return sorted;
  };

  // Sort data using bubble sort (most recent first)
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return bubbleSortByDate(data);
  }, [data]);

  // Scroll to highlighted return request when highlightReturnId changes
  useEffect(() => {
    if (highlightReturnId && highlightedCardRef.current && !isLoading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, [highlightReturnId, isLoading, sortedData]);

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
          <div className="space-y-4">
            {sortedData.map((record, index) => {
              const isHighlighted = highlightReturnId === record.id;
              return (
                <div 
                  key={record.id} 
                  className="relative"
                  ref={isHighlighted ? highlightedCardRef : null}
                >
                  {/* STT Badge */}
                  <div className="absolute -left-2 -top-2 z-10">
                    <div className={`w-8 h-8 ${isHighlighted ? 'bg-orange-600' : 'bg-orange-500'} text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg`}>
                      {(page - 1) * pageSize + index + 1}
                    </div>
                  </div>
                  {renderReturnCard(record, isHighlighted)}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
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

      {/* Dispute Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Khiếu nại lên admin</span>
          </div>
        }
        open={showDisputeModal.visible}
        onCancel={() => {
          if (disputingId || isUploadingDisputeMedia) return;
          setShowDisputeModal({ visible: false, returnId: null });
          setDisputeReason('');
          setDisputeImageFiles([]);
          setDisputeVideoFile(null);
        }}
        footer={null}
        width={600}
      >
        <div className="space-y-4 py-2">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Khiếu nại này sẽ được gửi lên admin để xem xét và xử lý. Vui lòng cung cấp đầy đủ thông tin và bằng chứng.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do khiếu nại <span className="text-red-500">*</span>
            </label>
            <TextArea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Nhập lý do khiếu nại chi tiết..."
              rows={4}
              maxLength={1000}
              showCount
              disabled={!!disputingId || isUploadingDisputeMedia}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mô tả chi tiết lý do khiếu nại và vấn đề không thỏa thuận được với khách hàng.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-orange-500" />
              <span>Hình ảnh đính kèm (tối đa 5 ảnh)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) => handleDisputeFileSelect(e, 'image')}
                disabled={disputingId !== null || isUploadingDisputeMedia || disputeImageFiles.length >= 5}
                className="hidden"
                id="dispute-image-upload"
              />
              <label
                htmlFor="dispute-image-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  disputingId !== null || isUploadingDisputeMedia || disputeImageFiles.length >= 5
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {disputeImageFiles.length >= 5 ? 'Đã đạt tối đa 5 ảnh' : 'Click để chọn ảnh hoặc kéo thả vào đây'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 10MB/ảnh)
                </span>
              </label>
            </div>
            {disputeImageFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {disputeImageFiles.map((item) => {
                  // Get object URL from Map using unique ID
                  const objectUrl = disputeImageUrlsRef.current.get(item.id);
                  if (!objectUrl) {
                    // This should not happen, but create URL if missing
                    const url = URL.createObjectURL(item.file);
                    disputeImageUrlsRef.current.set(item.id, url);
                    return (
                      <div key={item.id} className="relative group">
                        <img
                          src={url}
                          alt={`Dispute image ${item.file.name}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeDisputeImage(item.id)}
                          disabled={disputingId !== null || isUploadingDisputeMedia}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="relative group">
                      <img
                        src={objectUrl}
                        alt={`Dispute image ${item.file.name}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeDisputeImage(item.id)}
                        disabled={disputingId !== null || isUploadingDisputeMedia}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-orange-500" />
              <span>Video đính kèm (tối đa 1 video)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={(e) => handleDisputeFileSelect(e, 'video')}
                disabled={disputingId !== null || isUploadingDisputeMedia || !!disputeVideoFile}
                className="hidden"
                id="dispute-video-upload"
              />
              <label
                htmlFor="dispute-video-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  disputingId !== null || isUploadingDisputeMedia || !!disputeVideoFile
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {disputeVideoFile ? 'Đã chọn video' : 'Click để chọn video hoặc kéo thả vào đây'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: MP4, WEBM, OGG, MOV (tối đa 50MB)
                </span>
              </label>
            </div>
            {disputeVideoFile && (() => {
              // Use cached object URL if available, otherwise create one
              if (!disputeVideoUrlRef.current) {
                disputeVideoUrlRef.current = URL.createObjectURL(disputeVideoFile);
              }
              return (
                <div className="mt-3 relative">
                  <video
                    src={disputeVideoUrlRef.current}
                    controls
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                <button
                  onClick={removeDisputeVideo}
                  disabled={disputingId !== null || isUploadingDisputeMedia}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                if (disputingId || isUploadingDisputeMedia) return;
                // Cleanup object URLs before closing modal
                disputeImageUrlsRef.current.forEach((url) => {
                  URL.revokeObjectURL(url);
                });
                disputeImageUrlsRef.current.clear();
                if (disputeVideoUrlRef.current) {
                  URL.revokeObjectURL(disputeVideoUrlRef.current);
                  disputeVideoUrlRef.current = null;
                }
                setShowDisputeModal({ visible: false, returnId: null });
                setDisputeReason('');
                setDisputeImageFiles([]);
                setDisputeVideoFile(null);
              }}
              disabled={!!disputingId || isUploadingDisputeMedia}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<AlertTriangle className="w-4 h-4" />}
              onClick={handleDispute}
              disabled={!!disputingId || isUploadingDisputeMedia || !disputeReason.trim()}
              loading={!!disputingId || isUploadingDisputeMedia}
            >
              {isUploadingDisputeMedia ? 'Đang tải file...' : 'Gửi khiếu nại'}
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


