import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Select, Input, message, Alert } from 'antd';
import { Upload, X, Video, Loader2 } from 'lucide-react';
import type { CustomerOrder, OrderItem, ReturnReasonType } from '../../types/api';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';
import { formatCurrency } from '../../utils/orderStatus';
import { FileUploadService } from '../../services/FileUploadService';

const { Option } = Select;
const { TextArea } = Input;

interface ReturnRequestModalProps {
  open: boolean;
  order: CustomerOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const reasonTypeOptions: { value: ReturnReasonType; label: string }[] = [
  { value: 'CUSTOMER_FAULT', label: 'Khách hàng yêu cầu' },
  { value: 'SHOP_FAULT', label: 'Lỗi từ sản phẩm cửa hàng' },
];

const mapOrderItems = (order: CustomerOrder | null): OrderItem[] => {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  if (Array.isArray(order.storeOrders) && order.storeOrders.length > 0) {
    return order.storeOrders.flatMap((storeOrder) => storeOrder.items || []);
  }
  return [];
};

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ open, order, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const orderItems = useMemo(() => mapOrderItems(order), [order]);
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [reasonType, setReasonType] = useState<ReturnReasonType>('CUSTOMER_FAULT');
  const [reason, setReason] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedItemId(orderItems[0]?.id);
      setReason('');
      setVideoUrl('');
      setImageUrls([]);
      setReasonType('CUSTOMER_FAULT');
    }
  }, [open, orderItems]);

  const selectedItem = orderItems.find((item) => item.id === selectedItemId) || orderItems[0];
  const derivedPrice =
    selectedItem?.lineTotal ??
    selectedItem?.unitPrice ??
    order?.totalAmount ??
    order?.grandTotal ??
    0;

  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const fileArray = Array.from(files);
      const uploadResults = await FileUploadService.uploadMultipleImages(fileArray);
      const newUrls = uploadResults.map((result) => result.url);
      setImageUrls((prev) => [...prev, ...newUrls]);
      message.success(`Đã tải lên ${newUrls.length} hình ảnh`);
    } catch (error: any) {
      message.error(error?.message || 'Không thể tải lên hình ảnh');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/')) {
      message.error('Chỉ hỗ trợ định dạng video');
      e.target.value = '';
      return;
    }

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      message.error('Dung lượng video không được vượt quá 30MB');
      e.target.value = '';
      return;
    }

    try {
      setUploadingVideo(true);
      const uploadResult = await FileUploadService.uploadVideo(file);
      setVideoUrl(uploadResult.url);
      message.success('Đã tải lên video thành công');
    } catch (error: any) {
      message.error(error?.message || 'Không thể tải lên video');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
  };

  const handleSubmit = async () => {
    if (!selectedItem) {
      message.warning('Vui lòng chọn sản phẩm cần hoàn trả');
      return;
    }
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do hoàn trả');
      return;
    }

    try {
      setSubmitting(true);
      await OrderHistoryService.requestReturn({
        orderItemId: selectedItem.id,
        productId: selectedItem.refId,
        itemPrice: derivedPrice,
        reasonType,
        reason: reason.trim(),
        customerVideoUrl: videoUrl.trim() || undefined,
        customerImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      message.success('Đã gửi yêu cầu hoàn trả sản phẩm');
      onSuccess?.();
      onClose();
      // Chuyển đến trang lịch sử hoàn trả sau khi đóng modal
      navigate('/returns');
    } catch (error: any) {
      message.error(error?.message || 'Không thể gửi yêu cầu hoàn trả');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Yêu cầu hoàn trả sản phẩm"
      open={open}
      onCancel={() => {
        if (!submitting) {
          onClose();
        }
      }}
      okText="Gửi yêu cầu"
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      {orderItems.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy sản phẩm hợp lệ trong đơn hàng này."
          description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
        />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</p>
            <Select
              value={selectedItem?.id}
              onChange={(value) => setSelectedItemId(value)}
              className="w-full"
              disabled={orderItems.length === 0}
            >
              {orderItems.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name} • SL: {item.quantity}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Giá trị hoàn trả</p>
            <Input value={formatCurrency(derivedPrice)} disabled />
            <p className="text-xs text-gray-500 mt-1">
              Sử dụng số tiền theo yêu cầu (từ totalAmount của đơn hoặc giá sản phẩm).
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Loại lý do</p>
            <Select value={reasonType} onChange={setReasonType} className="w-full">
              {reasonTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Lý do chi tiết</p>
            <TextArea
              rows={3}
              placeholder="Mô tả lý do hoàn trả sản phẩm..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh (tùy chọn)</p>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors cursor-pointer bg-gray-50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFilesChange}
                className="hidden"
                id="return-image-upload"
                disabled={uploadingImages}
              />
              <label htmlFor="return-image-upload" className={`cursor-pointer ${uploadingImages ? 'opacity-50' : ''}`}>
                {uploadingImages ? (
                  <>
                    <Loader2 className="mx-auto h-8 w-8 text-orange-500 mb-2 animate-spin" />
                    <p className="text-xs text-gray-600">Đang tải lên...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">
                      Định dạng: JPG, PNG, WEBP, GIF (tối đa 10MB/ảnh)
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Image Preview Grid */}
            {imageUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Return ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              <Video className="inline h-4 w-4 mr-1" />
              Video (tùy chọn)
            </p>
            
            {!videoUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors bg-gray-50">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                  id="return-video-upload"
                  disabled={uploadingVideo}
                />
                <label htmlFor="return-video-upload" className={`cursor-pointer ${uploadingVideo ? 'opacity-50' : ''}`}>
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="mx-auto h-8 w-8 text-orange-500 mb-2 animate-spin" />
                      <p className="text-xs text-gray-600">Đang tải lên video...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">
                        Định dạng MP4 (tối đa 30MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="relative border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Video className="h-6 w-6 text-orange-500 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-900 truncate">Video đã tải lên</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full rounded-lg max-h-40"
                >
                  Trình duyệt không hỗ trợ video
                </video>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReturnRequestModal;


