import React, { useState } from 'react';
import { Card, Tag, Typography, Spin, Empty, Button, Modal } from 'antd';
import { Video as VideoIcon, Package, Calendar } from 'lucide-react';
import type { ReturnRequestResponse } from '../../../types/api';
import { formatCurrency, formatDate } from '../../../utils/orderStatus';
import { ReturnPackingModal, type PackingFormValues } from '../../ReturnPackingModal';
import { ReturnPackingService } from '../../../services/customer/ReturnPackingService';
import { ProductListService } from '../../../services/customer/ProductListService';
import { message } from 'antd';

const { Text, Title } = Typography;

export interface ReturnHistoryCardProps {
  data: ReturnRequestResponse | null;
  isLoading: boolean;
  error?: string | null;
  onReload?: () => void;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  AUTO_REFUNDED: 'blue',
  SHIPPING: 'blue',
  REFUNDED: 'green',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Chờ shop phản hồi',
  APPROVED: 'Đã duyệt yêu cầu',
  REJECTED: 'Từ chối yêu cầu',
  CANCELLED: 'Đã huỷ',
  AUTO_REFUNDED: 'Đã hoàn tiền (tự động)',
  SHIPPING: 'Đang hoàn trả',
  REFUNDED: 'Đã hoàn trả',
};

const ReturnHistoryCard: React.FC<ReturnHistoryCardProps> = ({
  data,
  isLoading,
  error,
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

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="py-12 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải thông tin hoàn trả...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-gray-200 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="py-12 text-center">
          <Text type="danger">{error}</Text>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-gray-200 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="py-12 text-center">
          <Empty description="Bạn chưa có yêu cầu hoàn trả nào" />
        </div>
      </Card>
    );
  }

  const filteredImages = Array.isArray(data.customerImageUrls)
    ? data.customerImageUrls.filter((url) => url && url !== 'string')
    : [];
  const hasRealVideo = data.customerVideoUrl && data.customerVideoUrl !== 'string';
  const hasPackageInfo =
    data.packageWeight != null &&
    data.packageLength != null &&
    data.packageWidth != null &&
    data.packageHeight != null &&
    data.shippingFee != null;

  return (
    <>
      <Card className="border-gray-200 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">
              Yêu cầu hoàn trả mới nhất
            </Title>
            <Tag color={statusColorMap[data.status] || 'default'}>
              {statusLabelMap[data.status] || data.status}
            </Tag>
          </div>
          {data.status === 'APPROVED' && data.autoApproved && (
            <Text type="secondary" className="text-xs">
              Yêu cầu trả hàng đã được hệ thống tự duyệt do shop không phản hồi.
            </Text>
          )}
          {data.status === 'SHIPPING' && data.trackingStatus === 'delivered' && (
            <Text type="secondary" className="text-xs text-orange-600">
              Shop đã nhận hàng – đang chờ xử lý (tối đa 48 giờ). Nếu shop không phản hồi, hệ thống sẽ hoàn lại tiền sản phẩm (không hoàn phí trả hàng).
            </Text>
          )}
          {data.status === 'CANCELLED' && (
            <Text type="secondary" className="text-xs">
              Yêu cầu trả hàng đã bị huỷ do bạn không gửi hàng trong thời hạn quy định.
            </Text>
          )}
          {data.status === 'AUTO_REFUNDED' && (
            <>
              <Text type="secondary" className="text-xs">
                Shop không phản hồi trong 48 giờ sau khi nhận hàng, hệ thống đã tự động hoàn lại tiền sản phẩm vào ví cho bạn.
              </Text>
              {data.faultType === 'CUSTOMER' && (
                <Text type="secondary" className="text-xs">
                  Do lỗi phát sinh từ phía khách, phí vận chuyển trả hàng không được hoàn lại.
                </Text>
              )}
              {data.faultType === 'SHOP' && (
                <Text type="secondary" className="text-xs">
                  Lỗi phát sinh từ phía shop. Phí vận chuyển được xử lý theo chính sách của từng chương trình khuyến mãi.
                </Text>
              )}
            </>
          )}

          {/* Product Info */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <Text type="secondary" className="text-xs">Sản phẩm</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{data.productName}</Text>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text type="secondary" className="text-xs">Giá hoàn trả</Text>
                  <div className="mt-1">
                    <Text strong className="text-lg text-orange-600">
                      {formatCurrency(data.itemPrice)}
                    </Text>
                  </div>
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Ngày tạo</Text>
                  <div className="mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <Text>{formatDate(data.createdAt)}</Text>
                  </div>
                </div>
              </div>

              {/* Images/Video Preview */}
              {(filteredImages.length > 0 || hasRealVideo) && (
                <div>
                  <Text type="secondary" className="text-xs">Hình ảnh / Video</Text>
                  <div className="mt-2 flex items-center gap-2">
                    {filteredImages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="grid grid-cols-3 gap-1">
                          {filteredImages.slice(0, 3).map((url, index) => (
                            <div
                              key={index}
                              className="relative group aspect-square rounded overflow-hidden border border-gray-200 cursor-pointer hover:border-orange-400 transition-all"
                              onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: index })}
                            >
                              <img
                                src={url}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === 2 && filteredImages.length > 3 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <Text className="text-white text-xs font-semibold">+{filteredImages.length - 3}</Text>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {filteredImages.length > 3 && (
                          <Text className="text-xs text-gray-500 ml-1">
                            +{filteredImages.length - 3} ảnh
                          </Text>
                        )}
                      </div>
                    )}
                    {hasRealVideo && data.customerVideoUrl && (
                      <div
                        className="relative rounded overflow-hidden border border-gray-200 cursor-pointer hover:border-orange-400 transition-all w-16 h-16"
                        onClick={() => setVideoPreview({ visible: true, url: data.customerVideoUrl || '' })}
                      >
                        <video
                          src={data.customerVideoUrl}
                          className="w-full h-full object-cover"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <VideoIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package Info */}
              {hasPackageInfo ? (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <Text strong className="text-sm">Thông tin gói hàng</Text>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Text type="secondary">Khối lượng:</Text>{' '}
                      <Text strong>{data.packageWeight} kg</Text>
                    </div>
                    <div>
                      <Text type="secondary">Kích thước:</Text>{' '}
                      <Text strong>
                        {data.packageLength} x {data.packageWidth} x {data.packageHeight} cm
                      </Text>
                    </div>
                    <div className="col-span-2">
                      <Text type="secondary">Phí vận chuyển:</Text>{' '}
                      <Text strong className="text-orange-600">
                        {formatCurrency(data.shippingFee || 0)}
                      </Text>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Text type="secondary" className="text-sm">Chưa đóng gói</Text>
                </div>
              )}

              {/* Action Button */}
              {data.status === 'APPROVED' && !hasPackageInfo && (
                <Button
                  type="primary"
                  size="middle"
                  onClick={() => handleOpenPackingModal(data)}
                  className="w-full"
                >
                  Thực hiện đóng gói và hoàn đơn
                </Button>
              )}
              {data.status === 'APPROVED' && hasPackageInfo && (
                <Button type="primary" size="middle" disabled className="w-full">
                  Đã đóng gói
                </Button>
              )}
              {data.status === 'CANCELLED' && (
                <Button type="primary" size="middle" disabled className="w-full">
                  Đã huỷ yêu cầu (quá hạn gửi hàng)
                </Button>
              )}
              {data.status === 'AUTO_REFUNDED' && (
                <Button type="primary" size="middle" disabled className="w-full">
                  Đã hoàn tiền (tự động)
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* End of space-y-4 wrapper */}
      </Card>

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
    </>
  );
};

export default ReturnHistoryCard;

