import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Space, Pagination, Empty, Spin, Button, message, Modal, Input } from 'antd';
import { ZoomIn, Video as VideoIcon, X } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../types/api';
import { formatDate, formatCurrency } from '../../utils/orderStatus';
import { StoreReturnService } from '../../services/seller/StoreReturnService';
import PickShiftModal from './PickShiftModal';
import { GhnService } from '../../services/seller/GhnService';

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
  SHIPPING: 'blue',
  REFUNDED: 'green',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Khách hàng yêu cầu',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Đang chờ duyệt yêu cầu',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SHIPPING: 'Đang hoàn trả',
  REFUNDED: 'Đã hoàn tiền',
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
      width: 220,
      render: (value: string) => <Text strong>{value}</Text>,
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
      width: 150,
      render: (value: string) => (
        <Tag color={statusColorMap[value] || 'default'}>
          {statusLabelMap[value] || value}
        </Tag>
      ),
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
            {record.faultType && (
              <Text type="secondary">
                Phân loại lỗi: <Text strong>{record.faultType}</Text>
              </Text>
            )}
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
                >
                  Theo dõi đơn
                </Button>
              </>
            )}
            {hasTracking && (
              <Text>
                Trạng thái: <Text strong>{record.trackingStatus}</Text>
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
        if (record.status === 'PENDING') {
          return (
            <Space direction="vertical" size={8} className="w-full">
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

        if (hasPackageInfo(record)) {
          return (
            <Button
              type="default"
              size="small"
              onClick={() => handleOpenPickShiftModal(record)}
            >
              Xác nhận ca lấy hàng
            </Button>
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
    </Card>
  );
};

export default StoreReturnList;


