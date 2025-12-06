import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Pagination, Empty, Spin, Button, message, Modal, Space } from 'antd';
import { ZoomIn, Video as VideoIcon } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../../types/api';
import { formatCurrency, formatDate } from '../../../utils/orderStatus';
import { ReturnPackingModal, type PackingFormValues } from '../../ReturnPackingModal';
import { ReturnPackingService } from '../../../services/customer/ReturnPackingService';
import { ProductListService } from '../../../services/customer/ProductListService';

const { Text } = Typography;

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
  AUTO_REFUNDED: 'blue',
  SHIPPING: 'blue',
  REFUNDED: 'green',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Khách hàng yêu cầu',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
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

  const columns: ColumnsType<ReturnRequestResponse> = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_: any, __: ReturnRequestResponse, index: number) => (
        <Text>{(page - 1) * pageSize + index + 1}</Text>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 220,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Giá hoàn trả',
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      width: 160,
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
          <Space direction="vertical" size={4}>
            <Tag color={statusColorMap[record.status] || 'default'}>
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
          return <Text type="secondary">Không cung cấp</Text>;
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
          return <Text type="secondary">Chưa đóng gói</Text>;
        }

        return (
          <div className="space-y-1 text-xs">
            <div>
              Khối lượng:{' '}
              <Text strong>
                {record.packageWeight} kg
              </Text>
            </div>
            <div>
              Kích thước:{' '}
              <Text strong>
                {record.packageLength} x {record.packageWidth} x {record.packageHeight} cm
              </Text>
            </div>
            <div>
              Phí vận chuyển:{' '}
              <Text strong>{formatCurrency(record.shippingFee || 0)}</Text>
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
      render: (value: string) => <Text>{formatDate(value)}</Text>,
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
            <Button type="primary" size="small" disabled>
              Đã đóng gói
            </Button>
          );
        }

        return (
          <Button
            type="primary"
            size="small"
            onClick={() => handleOpenPackingModal(record)}
          >
            Thực hiện đóng gói và hoàn đơn
          </Button>
        );
      },
    },
  ];

  return (
    <Card
      title="Lịch sử hoàn trả"
      className="border-gray-200 shadow-sm"
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 0 }}
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải lịch sử hoàn trả...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center">
          <Empty description="Bạn chưa có yêu cầu hoàn trả nào" />
        </div>
      ) : (
        <>
          <Table<ReturnRequestResponse>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 1200 }}
          />
          <div className="px-4 py-3 flex justify-end">
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
    </Card>
  );
};

export default ReturnHistory;


