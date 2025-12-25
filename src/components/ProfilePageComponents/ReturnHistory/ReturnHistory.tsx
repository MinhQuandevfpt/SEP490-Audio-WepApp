import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Tag, Typography, Pagination, Empty, Spin, Button, message, Modal, Space, Input, Upload } from 'antd';
import { ZoomIn, Video as VideoIcon, AlertTriangle, Upload as UploadIcon, X } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../../types/api';
import { formatCurrency, formatDate } from '../../../utils/orderStatus';
import { ReturnPackingModal, type PackingFormValues } from '../../ReturnPackingModal';
import { ReturnPackingService } from '../../../services/customer/ReturnPackingService';
import { ProductListService } from '../../../services/customer/ProductListService';
import { OrderHistoryService } from '../../../services/customer/OrderHistoryService';
import { FileUploadService } from '../../../services/FileUploadService';

const { Text } = Typography;
const { TextArea } = Input;


export interface ReturnHistoryProps {
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
  AUTO_REFUNDED: 'blue',
  SHIPPING: 'blue',
  RECEIVED: 'cyan',
  DISPUTE: 'orange',
  DISPUTE_ESCALATED: 'purple',
  DISPUTE_RESOLVED_SHOP: 'red',
  DISPUTE_RESOLVED_CUSTOMER: 'green',
  REFUNDED: 'green',
  RETURN_DONE: 'blue',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Khách hàng yêu cầu',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Chờ shop phản hồi',
  APPROVED: 'Đã duyệt yêu cầu – Vui lòng gửi hàng',
  REJECTED: 'Từ chối yêu cầu',
  CANCELLED: 'Đã huỷ (khách không gửi hàng)',
  CANCELED: 'Đã huỷ yêu cầu',
  AUTO_REFUNDED: 'Đã hoàn tiền (tự động)',
  SHIPPING: 'GHN đang vận chuyển',
  RECEIVED: 'Shop đã xác nhận nhận hàng',
  DISPUTE: 'Đang khiếu nại',
  DISPUTE_ESCALATED: 'Khiếu nại đã được đưa lên sàn xử lý',
  DISPUTE_RESOLVED_SHOP: 'Khiếu nại đã được giải quyết có lợi cho shop',
  DISPUTE_RESOLVED_CUSTOMER: 'Khiếu nại đã được giải quyết có lợi cho bạn',
  REFUNDED: 'Đã hoàn tiền',
  RETURN_DONE: 'Hoàn tất quy trình trả hàng',
};

const ReturnHistory: React.FC<ReturnHistoryProps> = ({
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onPageChange,
  onReload,
}) => {
  const [packingModalOpen, setPackingModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestResponse | null>(null);
  const [packingInitialValues, setPackingInitialValues] = useState<Partial<PackingFormValues>>({});
  const [packingLoading, setPackingLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productWeight, setProductWeight] = useState<number | null>(null);
  const [productDimensions, setProductDimensions] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ visible: boolean; urls: string[]; current: number }>({
    visible: false,
    urls: [],
    current: 0,
  });
  const [videoPreview, setVideoPreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: '',
  });
  const [showComplaintModal, setShowComplaintModal] = useState<{ visible: boolean; returnId: string | null }>({
    visible: false,
    returnId: null,
  });
  const [complaintReason, setComplaintReason] = useState('');
  // Use objects with unique IDs instead of File[] to avoid index-based key issues
  type ComplaintImageFile = {
    id: string;
    file: File;
  };
  const [complaintImageFiles, setComplaintImageFiles] = useState<ComplaintImageFile[]>([]);
  const [complaintVideoFile, setComplaintVideoFile] = useState<File | null>(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  // Track object URLs for memory cleanup - use Map with unique IDs as keys
  const complaintImageUrlsRef = useRef<Map<string, string>>(new Map());
  const complaintVideoUrlRef = useRef<string | null>(null);

  const handleOpenPackingModal = async (record: ReturnRequestResponse) => {
    setSelectedReturn(record);
    setPackingModalOpen(true);
    setPackingLoading(true);
    setProductWeight(null);
    setProductDimensions(null);
    
    try {
      // Fetch addresses và product info song song
      const [addresses, productInfo] = await Promise.all([
        ReturnPackingService.getDefaultAddressesForReturn(record),
        ProductListService.getProductById(record.productId).catch(() => null), // Nếu lỗi thì bỏ qua
      ]);

      setPackingInitialValues((prev) => ({
        ...prev,
        customerAddressId: addresses.customerAddressId || '',
        storeAddressId: addresses.storeAddressId || '',
      }));

      // Lấy weight và dimensions từ product info nếu có
      if (productInfo?.data) {
        if (productInfo.data.weight) {
          setProductWeight(productInfo.data.weight);
        }
        
        if (productInfo.data.dimensions) {
          setProductDimensions(productInfo.data.dimensions);
        }
      }
    } catch (e: any) {
      message.error(e?.message || 'Không thể tự động lấy địa chỉ mặc định. Vui lòng kiểm tra lại.');
    } finally {
      setPackingLoading(false);
    }
  };

  const handleSubmitPacking = async (values: PackingFormValues) => {
    if (!selectedReturn) {
      message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
      return;
    }

    try {
      setSubmitLoading(true);
      const shippingFee = await ReturnPackingService.submitPackageInfo(selectedReturn.id, values);

      if (typeof shippingFee === 'number') {
        message.success('Xác nhận đóng gói thành công đơn hoàn trả. Phí vận chuyển: ' + formatCurrency(shippingFee));
      } else {
        message.success('Xác nhận đóng gói thành công đơn hoàn trả.');
      }

      setPackingModalOpen(false);
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể xác nhận đóng gói đơn hoàn trả');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleComplaintFileSelect = (type: 'image' | 'video', file: File) => {
    if (type === 'image') {
      if (complaintImageFiles.length >= 5) {
        message.warning('Chỉ có thể tải lên tối đa 5 ảnh');
        return;
      }
      
      // Validate file type and size
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
      
      if (!validation.isValid) {
        message.error(`${file.name}: ${validation.error}`);
        return;
      }
      
      setComplaintImageFiles((prev) => {
        // Create unique ID for new file and object URL
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const url = URL.createObjectURL(file);
        complaintImageUrlsRef.current.set(id, url);
        return [...prev, { id, file }];
      });
    } else {
      if (complaintVideoFile) {
        message.warning('Chỉ có thể tải lên 1 video');
        return;
      }
      
      // Validate video file type and size
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
      
      if (!validation.isValid) {
        message.error(`${file.name}: ${validation.error}`);
        return;
      }
      
      // Revoke previous video URL if exists
      if (complaintVideoUrlRef.current) {
        URL.revokeObjectURL(complaintVideoUrlRef.current);
      }
      // Create new object URL
      complaintVideoUrlRef.current = URL.createObjectURL(file);
      setComplaintVideoFile(file);
    }
  };

  const removeComplaintImage = (fileId: string) => {
    setComplaintImageFiles((prev) => {
      // Revoke object URL for removed file
      const url = complaintImageUrlsRef.current.get(fileId);
      if (url) {
        URL.revokeObjectURL(url);
        complaintImageUrlsRef.current.delete(fileId);
      }
      return prev.filter(item => item.id !== fileId);
    });
  };

  const removeComplaintVideo = () => {
    // Revoke object URL before clearing video file
    if (complaintVideoUrlRef.current) {
      URL.revokeObjectURL(complaintVideoUrlRef.current);
      complaintVideoUrlRef.current = null;
    }
    setComplaintVideoFile(null);
  };

  // Cleanup object URLs when modal closes or component unmounts
  useEffect(() => {
    return () => {
      // Revoke all image URLs
      complaintImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      complaintImageUrlsRef.current.clear();
      // Revoke video URL
      if (complaintVideoUrlRef.current) {
        URL.revokeObjectURL(complaintVideoUrlRef.current);
        complaintVideoUrlRef.current = null;
      }
    };
  }, []);

  // Cleanup when complaint modal closes
  useEffect(() => {
    if (!showComplaintModal.visible) {
      // Revoke all image URLs
      complaintImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      complaintImageUrlsRef.current.clear();
      // Revoke video URL
      if (complaintVideoUrlRef.current) {
        URL.revokeObjectURL(complaintVideoUrlRef.current);
        complaintVideoUrlRef.current = null;
      }
    }
  }, [showComplaintModal.visible]);

  const handleSubmitComplaint = async () => {
    if (!showComplaintModal.returnId) {
      message.error('Không tìm thấy thông tin yêu cầu hoàn trả.');
      return;
    }

    if (!complaintReason.trim()) {
      message.warning('Vui lòng nhập lý do khiếu nại');
      return;
    }

    try {
      setIsSubmittingComplaint(true);

      // Upload images
      let imageUrls: string[] = [];
      if (complaintImageFiles.length > 0) {
        const uploadPromises = complaintImageFiles.map(item => FileUploadService.uploadImage(item.file));
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.url);
      }

      // Upload video
      let videoUrl: string | undefined;
      if (complaintVideoFile) {
        const videoResult = await FileUploadService.uploadVideo(complaintVideoFile);
        videoUrl = videoResult.url;
      }

      // Submit complaint
      await OrderHistoryService.submitComplaint({
        returnRequestId: showComplaintModal.returnId,
        reason: complaintReason.trim(),
        customerVideoUrl: videoUrl || undefined,
        customerImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      message.success('Đã gửi khiếu nại thành công. Hệ thống sẽ xem xét và xử lý.');
      setShowComplaintModal({ visible: false, returnId: null });
      setComplaintReason('');
      setComplaintImageFiles([]);
      setComplaintVideoFile(null);
      // Revoke URLs after successful submission
      complaintImageUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      complaintImageUrlsRef.current.clear();
      if (complaintVideoUrlRef.current) {
        URL.revokeObjectURL(complaintVideoUrlRef.current);
        complaintVideoUrlRef.current = null;
      }
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể gửi khiếu nại. Vui lòng thử lại.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const columns: ColumnsType<ReturnRequestResponse> = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_: any, __: ReturnRequestResponse, index: number) => (
        <Text className="text-gray-600 font-medium">{(page - 1) * pageSize + index + 1}</Text>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 220,
      render: (value: string) => (
        <Text strong className="text-gray-800 text-sm leading-5">
          {value}
        </Text>
      ),
    },
    {
      title: 'Giá hoàn trả',
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      width: 160,
      align: 'right',
      render: (value: number) => (
        <Text strong className="text-orange-500 text-base font-semibold whitespace-nowrap">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Loại lý do',
      dataIndex: 'reasonType',
      key: 'reasonType',
      width: 180,
      render: (value: string) => (
        <Tag 
          color={value === 'SHOP_FAULT' ? 'red' : 'default'}
          className="font-medium text-xs px-3 py-1 rounded-full"
        >
          {reasonTypeLabel[value] || value}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (_: string, record: ReturnRequestResponse) => {
        const isAutoApproved = record.status === 'APPROVED' && record.autoApproved;
        const isAutoCancelled = record.status === 'CANCELLED';
        const isAutoRefunded = record.status === 'AUTO_REFUNDED';
        const autoRefundText = (() => {
          if (!isAutoRefunded) return null;
          if (record.faultType === 'CUSTOMER') {
            return (
              <>
                Shop không phản hồi trong 48 giờ sau khi nhận hàng, hệ thống đã tự động hoàn lại tiền sản phẩm vào ví cho bạn. Do lỗi phát sinh từ phía khách, phí vận chuyển trả hàng không được hoàn lại.
              </>
            );
          }
          if (record.faultType === 'SHOP') {
            return (
              <>
                Shop không phản hồi trong 48 giờ sau khi nhận hàng, hệ thống đã tự động hoàn lại tiền sản phẩm vào ví cho bạn. Lỗi phát sinh từ phía shop. Phí vận chuyển được xử lý theo chính sách của từng chương trình khuyến mãi.
              </>
            );
          }
          return (
            <>
              Shop không phản hồi trong 48 giờ sau khi nhận hàng, hệ thống đã tự động hoàn lại tiền sản phẩm vào ví cho bạn.
            </>
          );
        })();
        // Case 4.4: GHN không pickup sau 48h
        // Chỉ áp dụng khi đã từng có GHN order (status = SHIPPING) nhưng bị reset về APPROVED
        // Dấu hiệu: status = APPROVED, có package info, không có ghnOrderCode, 
        // và trackingStatus có thể là null (đã bị clear) hoặc 'ready_to_pick' (vẫn chờ lấy)
        // Để phân biệt với trường hợp mới có package info: check nếu updatedAt cách xa hơn 5 phút
        const hasPackageInfoForGhn = 
          record.status === 'APPROVED' &&
          record.shippingFee != null &&
          record.packageWeight != null &&
          record.packageLength != null &&
          record.packageWidth != null &&
          record.packageHeight != null;
        const isGhnTimeoutCase = 
          hasPackageInfoForGhn &&
          !record.ghnOrderCode &&
          (record.trackingStatus === null || record.trackingStatus === 'ready_to_pick');
        // Check updatedAt để đảm bảo đây là trường hợp đã từng có GHN order (ít nhất 5 phút trước)
        const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const needsRecreateGhn = isGhnTimeoutCase && updatedAt && updatedAt <= fiveMinutesAgo;
        const label = isAutoApproved
          ? 'Shop đã duyệt (tự động)'
          : isAutoCancelled
            ? 'Yêu cầu bị huỷ (quá hạn gửi hàng)'
            : isAutoRefunded
              ? 'Đã hoàn tiền (tự động)'
            : statusLabelMap[record.status] || record.status;

        return (
          <Space direction="vertical" size={6}>
            <Tag 
              color={statusColorMap[record.status] || 'default'}
              className="font-semibold text-xs px-3 py-1.5 rounded-md shadow-sm"
            >
              {label}
            </Tag>
            {record.status === 'PENDING' && (
              <Text type="secondary" className="text-xs">
                Chờ shop phản hồi
              </Text>
            )}
            {record.status === 'SHIPPING' && record.trackingStatus === 'delivered' && (
              <Text type="secondary" className="text-xs text-orange-600">
                Shop đã nhận hàng – đang chờ xử lý (tối đa 48 giờ). Nếu shop không phản hồi, hệ thống sẽ hoàn lại tiền sản phẩm (không hoàn phí trả hàng).
              </Text>
            )}
            {isAutoApproved && (
              <Text type="secondary" className="text-xs">
                Yêu cầu trả hàng đã được hệ thống tự duyệt do shop không phản hồi.
              </Text>
            )}
            {isAutoCancelled && (
              <Text type="secondary" className="text-xs">
                Yêu cầu trả hàng đã bị huỷ do bạn không gửi hàng trong thời hạn quy định.
              </Text>
            )}
            {isAutoRefunded && autoRefundText && (
              <Text type="secondary" className="text-xs">
                {autoRefundText}
              </Text>
            )}
            {needsRecreateGhn && (
              <Text type="secondary" className="text-xs">
                Đơn vị vận chuyển không đến lấy hàng. Shop sẽ tạo lại đơn lấy hàng mới.
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
          return (
            <Text type="secondary" className="text-sm italic">
              Không cung cấp
            </Text>
          );
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
      width: 280,
      render: (_: any, record: ReturnRequestResponse) => {
        const hasPackageInfo =
          record.packageWeight != null &&
          record.packageLength != null &&
          record.packageWidth != null &&
          record.packageHeight != null &&
          record.shippingFee != null;

        if (!hasPackageInfo) {
          return (
            <Text type="secondary" className="text-sm italic">
              Chưa đóng gói
            </Text>
          );
        }

        return (
          <div className="text-sm whitespace-nowrap flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Khối lượng:</span>
              <Text strong className="text-gray-800">
                {record.packageWeight} kg
              </Text>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Kích thước:</span>
              <Text strong className="text-gray-800">
                {record.packageLength} × {record.packageWidth} × {record.packageHeight} cm
              </Text>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Phí vận chuyển:</span>
              <Text strong className="text-gray-800">{formatCurrency(record.shippingFee || 0)}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 190,
      render: (value: string) => (
        <Text className="text-gray-600 text-sm">{formatDate(value)}</Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_: any, record: ReturnRequestResponse) => {
        if (record.status === 'CANCELLED') {
          return (
            <Text type="secondary" className="text-xs">
              Yêu cầu trả hàng đã bị huỷ do bạn không gửi hàng trong thời hạn quy định.
            </Text>
          );
        }

        if (record.status === 'AUTO_REFUNDED') {
          return (
            <Space direction="vertical" size={4}>
              <Text strong className="text-xs text-blue-600">
                Đã hoàn tiền (tự động)
              </Text>
              <Text type="secondary" className="text-xs">
                Hệ thống đã tự hoàn tiền do shop không xử lý sau khi nhận hàng.
              </Text>
            </Space>
          );
        }

        // Customer can complain when:
        // 1. REJECTED - Shop rejected the return request
        // 2. DISPUTE_RESOLVED_SHOP - Dispute resolved in favor of shop
        // 3. Other cases where customer doesn't agree with shop's decision
        const canComplain = 
          record.status === 'REJECTED' || 
          record.status === 'DISPUTE_RESOLVED_SHOP' ||
          (record.status === 'RECEIVED' && record.faultType === 'CUSTOMER'); // Shop received but marked as customer fault

        if (canComplain) {
          return (
            <Button
              type="default"
              size="small"
              danger
              icon={<AlertTriangle className="w-4 h-4" />}
              className="font-medium"
              onClick={() => {
                setShowComplaintModal({ visible: true, returnId: record.id });
                setComplaintReason('');
                setComplaintImageFiles([]);
                setComplaintVideoFile(null);
                // Clear and revoke any existing URLs when opening the modal
                complaintImageUrlsRef.current.forEach((url) => {
                  URL.revokeObjectURL(url);
                });
                complaintImageUrlsRef.current.clear();
                if (complaintVideoUrlRef.current) {
                  URL.revokeObjectURL(complaintVideoUrlRef.current);
                  complaintVideoUrlRef.current = null;
                }
              }}
            >
              Khiếu nại
            </Button>
          );
        }

        if (record.status === 'DISPUTE' || record.status === 'DISPUTE_ESCALATED') {
          return (
            <Text type="secondary" className="text-xs">
              Đang xử lý khiếu nại
            </Text>
          );
        }

        if (record.status !== 'APPROVED') {
          return <Text type="secondary">—</Text>;
        }

        const hasPackageInfo =
          record.packageWeight != null &&
          record.packageLength != null &&
          record.packageWidth != null &&
          record.packageHeight != null &&
          record.shippingFee != null;

        if (hasPackageInfo) {
          return (
            <Button 
              type="primary" 
              size="small" 
              disabled
              className="font-medium"
            >
              Đã đóng gói
            </Button>
          );
        }

        return (
          <Button
            type="primary"
            size="small"
            onClick={() => handleOpenPackingModal(record)}
            className="font-medium bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            Thực hiện đóng gói và hoàn đơn
          </Button>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">Lịch sử hoàn trả</span>
        </div>
      }
      className="border-gray-200 shadow-md"
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 0 }}
      headStyle={{ 
        background: 'linear-gradient(to right, #f9fafb, #ffffff)',
        borderBottom: '2px solid #e5e7eb',
        borderRadius: '12px 12px 0 0',
        padding: '20px 24px'
      }}
    >
      {isLoading ? (
        <div className="py-16 text-center">
          <Spin size="large" className="mb-4" />
          <p className="mt-4 text-gray-600 text-base">Đang tải lịch sử hoàn trả...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <Text type="danger" className="text-base font-medium">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <Empty 
            description={<span className="text-gray-600 text-base">Bạn chưa có yêu cầu hoàn trả nào</span>}
          />
        </div>
      ) : (
        <>
          <div className="overflow-hidden">
            <Table<ReturnRequestResponse>
              rowKey="id"
              columns={columns}
              dataSource={data}
              pagination={false}
              scroll={{ x: 1200 }}
              className="return-history-table"
              rowClassName="hover:bg-gray-50 transition-colors border-b border-gray-100"
              style={{
                backgroundColor: '#ffffff',
              }}
            />
          </div>
          
          {/* Custom styles for return history table */}
          <style>{`
            .return-history-table .ant-table-thead > tr > th {
              background: #f9fafb !important;
              font-weight: 600 !important;
              color: #374151 !important;
              border-bottom: 2px solid #e5e7eb !important;
              padding: 14px 16px !important;
              font-size: 13px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
            }
            .return-history-table .ant-table-tbody > tr > td {
              padding: 16px !important;
              border-bottom: 1px solid #f3f4f6 !important;
              vertical-align: top !important;
            }
            .return-history-table .ant-table-tbody > tr:hover > td {
              background: #f9fafb !important;
            }
            .return-history-table .ant-table-container {
              border: none !important;
            }
            .return-history-table .ant-table {
              border-radius: 0 !important;
            }
          `}</style>
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-t border-gray-200">
            <Text className="text-gray-600 text-sm">
              Hiển thị <strong>{(page - 1) * pageSize + 1}</strong> - <strong>{Math.min(page * pageSize, total)}</strong> trong tổng số <strong>{total}</strong> yêu cầu
            </Text>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={['5', '10', '20', '50']}
              onChange={onPageChange}
              className="return-history-pagination"
            />
          </div>
        </>
      )}

      <ReturnPackingModal
        open={packingModalOpen}
        onCancel={() => {
          setPackingModalOpen(false);
          setProductWeight(null);
          setProductDimensions(null);
        }}
        onSubmit={handleSubmitPacking}
        initialValues={packingInitialValues}
        loading={packingLoading || submitLoading}
        productWeight={productWeight}
        productDimensions={productDimensions}
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

      {/* Complaint Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Khiếu nại về xử lý hoàn trả</span>
          </div>
        }
        open={showComplaintModal.visible}
          onCancel={() => {
            if (isSubmittingComplaint) return;
            setShowComplaintModal({ visible: false, returnId: null });
            setComplaintReason('');
            setComplaintImageFiles([]);
            setComplaintVideoFile(null);
            // Cleanup object URLs before closing modal
            complaintImageUrlsRef.current.forEach((url) => {
              URL.revokeObjectURL(url);
            });
            complaintImageUrlsRef.current.clear();
            if (complaintVideoUrlRef.current) {
              URL.revokeObjectURL(complaintVideoUrlRef.current);
              complaintVideoUrlRef.current = null;
            }
          }}
        footer={null}
        width={600}
        maskClosable={!isSubmittingComplaint}
        closable={!isSubmittingComplaint}
      >
        <div className="space-y-4 py-2">
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">
                  Thông tin quan trọng
                </p>
                <p className="text-sm text-orange-800">
                  Nếu bạn không đồng ý với quyết định của shop, vui lòng cung cấp lý do và bằng chứng (ảnh/video) để hệ thống xem xét lại.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Lý do khiếu nại <span className="text-red-500">*</span>
            </label>
            <TextArea
              value={complaintReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComplaintReason(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lý do bạn không đồng ý với quyết định của shop..."
              rows={4}
              maxLength={1000}
              showCount
              disabled={isSubmittingComplaint}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Hình ảnh (tối đa 5 ảnh)
            </label>
            <div className="space-y-2">
              {complaintImageFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {complaintImageFiles.map((item) => {
                    // Get object URL from Map using unique ID
                    const objectUrl = complaintImageUrlsRef.current.get(item.id);
                    if (!objectUrl) {
                      // This should not happen, but create URL if missing
                      const url = URL.createObjectURL(item.file);
                      complaintImageUrlsRef.current.set(item.id, url);
                      return (
                        <div key={item.id} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${item.file.name}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => removeComplaintImage(item.id)}
                            disabled={isSubmittingComplaint}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          alt={`Preview ${item.file.name}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeComplaintImage(item.id)}
                          disabled={isSubmittingComplaint}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {complaintImageFiles.length < 5 && (
                <Upload
                  accept="image/*"
                  beforeUpload={(file) => {
                    handleComplaintFileSelect('image', file);
                    return false;
                  }}
                  showUploadList={false}
                  disabled={isSubmittingComplaint}
                >
                  <Button icon={<UploadIcon className="w-4 h-4" />} disabled={isSubmittingComplaint}>
                    Chọn ảnh
                  </Button>
                </Upload>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Video (tối đa 1 video)
            </label>
            <div className="space-y-2">
              {complaintVideoFile && (() => {
                // Create object URL if not already created
                if (!complaintVideoUrlRef.current) {
                  complaintVideoUrlRef.current = URL.createObjectURL(complaintVideoFile);
                }
                return (
                  <div className="relative group">
                    <video
                      src={complaintVideoUrlRef.current}
                      controls
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                  <button
                    onClick={removeComplaintVideo}
                    disabled={isSubmittingComplaint}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
              {!complaintVideoFile && (
                <Upload
                  accept="video/*"
                  beforeUpload={(file) => {
                    handleComplaintFileSelect('video', file);
                    return false;
                  }}
                  showUploadList={false}
                  disabled={isSubmittingComplaint}
                >
                  <Button icon={<UploadIcon className="w-4 h-4" />} disabled={isSubmittingComplaint}>
                    Chọn video
                  </Button>
                </Upload>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              size="large"
              onClick={() => {
                if (isSubmittingComplaint) return;
                setShowComplaintModal({ visible: false, returnId: null });
                setComplaintReason('');
                setComplaintImageFiles([]);
                setComplaintVideoFile(null);
                // Cleanup object URLs before closing modal
                complaintImageUrlsRef.current.forEach((url) => {
                  URL.revokeObjectURL(url);
                });
                complaintImageUrlsRef.current.clear();
                if (complaintVideoUrlRef.current) {
                  URL.revokeObjectURL(complaintVideoUrlRef.current);
                  complaintVideoUrlRef.current = null;
                }
              }}
              disabled={isSubmittingComplaint}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              danger
              icon={<AlertTriangle className="w-4 h-4" />}
              onClick={handleSubmitComplaint}
              disabled={isSubmittingComplaint || !complaintReason.trim()}
              loading={isSubmittingComplaint}
              className="min-w-[160px]"
            >
              {isSubmittingComplaint ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ReturnHistory;


