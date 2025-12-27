import React, { useState, useEffect, useRef } from 'react';
import { Card, Tag, Typography, Space, Pagination, Empty, Spin, Button, Modal, Input, Radio, message, Divider } from 'antd';
import { ZoomIn, Video as VideoIcon, Package, CheckCircle, AlertTriangle, Calendar, DollarSign, Store, User, Award, Truck, Box } from 'lucide-react';
import type { ReturnRequestResponse } from '../../types/api';
import { formatDate, formatCurrency } from '../../utils/orderStatus';
import { ProductListService } from '../../services/customer/ProductListService';
import { AdminReturnService } from '../../services/admin/AdminReturnService';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface AdminReturnDisputesListProps {
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

const AdminReturnDisputesList: React.FC<AdminReturnDisputesListProps> = ({
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onPageChange,
  onReload,
}) => {
  const [imagePreview, setImagePreview] = useState<{ visible: boolean; urls: string[]; current: number }>({
    visible: false,
    urls: [],
    current: 0,
  });
  const [videoPreview, setVideoPreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: '',
  });
  const [productCache, setProductCache] = useState<Map<string, { image?: string; variantOptionName?: string; variantOptionValue?: string; variantUrl?: string }>>(new Map());
  const loadedProductIdsRef = useRef<Set<string>>(new Set());
  const [showResolveModal, setShowResolveModal] = useState<{ visible: boolean; returnId: string | null }>({
    visible: false,
    returnId: null,
  });
  const [faultType, setFaultType] = useState<'CUSTOMER' | 'SHOP'>('CUSTOMER');
  const [refundCustomer, setRefundCustomer] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Load product details for all disputes
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = Array.from(new Set(data.map(item => item.productId)));
      const missingIds = productIds.filter(id => !loadedProductIdsRef.current.has(id));
      
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
                variantOptionName: undefined,
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

        // Update cache using functional update to avoid dependency on productCache
        setProductCache((prevCache) => {
          const newCache = new Map(prevCache);
          productDetails.forEach(detail => {
            newCache.set(detail.productId, {
              image: detail.image,
              variantOptionName: detail.variantOptionName,
              variantOptionValue: detail.variantOptionValue,
              variantUrl: detail.variantUrl,
            });
            // Track loaded IDs in ref
            loadedProductIdsRef.current.add(detail.productId);
          });
          return newCache;
        });
      } catch (error) {
        console.error('Error loading product details:', error);
      }
    };

    if (data.length > 0) {
      loadProductDetails();
    }
  }, [data]);

  // Helper function to get product image from cache
  const getProductImage = (record: ReturnRequestResponse): string | undefined => {
    const cached = productCache.get(record.productId);
    return cached?.image || cached?.variantUrl || undefined;
  };

  const handleResolve = async () => {
    if (!showResolveModal.returnId) {
      message.error('Không tìm thấy thông tin khiếu nại.');
      return;
    }

    if (!adminNote.trim()) {
      message.warning('Vui lòng nhập ghi chú của admin');
      return;
    }

    try {
      setResolvingId(showResolveModal.returnId);
      await AdminReturnService.resolveDispute(showResolveModal.returnId, {
        faultType,
        refundCustomer,
        adminNote: adminNote.trim(),
      });

      message.success('Đã giải quyết khiếu nại thành công');
      setShowResolveModal({ visible: false, returnId: null });
      setAdminNote('');
      setFaultType('CUSTOMER');
      setRefundCustomer(true);
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể giải quyết khiếu nại. Vui lòng thử lại.');
    } finally {
      setResolvingId(null);
    }
  };

  const renderDisputeCard = (record: ReturnRequestResponse) => {
    const productImage = getProductImage(record);
    const rawImages = Array.isArray(record.customerImageUrls)
      ? record.customerImageUrls.filter(Boolean)
      : [];
    const filteredImages = rawImages.filter((url) => url !== 'string');
    const rawVideo = record.customerVideoUrl || '';
    const hasRealImages = filteredImages.length > 0;
    const hasRealVideo = rawVideo && rawVideo !== 'string';
    const canResolve = record.status === 'DISPUTE' || record.status === 'DISPUTE_ESCALATED';
    const statusLabel = statusLabelMap[record.status] || record.status;

    return (
      <Card
        key={record.id}
        className="mb-4 hover:shadow-lg transition-shadow"
        style={{ borderRadius: 12 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
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
                <Package className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </div>

          {/* Center: Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Title level={5} className="!mb-2 !text-base">
                  {record.productName}
                </Title>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Tag color={record.reasonType === 'SHOP_FAULT' ? 'red' : 'default'}>
                    {reasonTypeLabel[record.reasonType] || record.reasonType}
                  </Tag>
                  <Tag color={statusColorMap[record.status] || 'default'}>
                    {statusLabel}
                  </Tag>
                </div>
              </div>
              {canResolve && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => {
                    setShowResolveModal({ visible: true, returnId: record.id });
                    setFaultType('CUSTOMER');
                    setRefundCustomer(true);
                    setAdminNote('');
                  }}
                  disabled={resolvingId === record.id}
                  loading={resolvingId === record.id}
                  className="ml-4 flex-shrink-0"
                >
                  Giải quyết
                </Button>
              )}
            </div>

            {/* Thông tin người gửi khiếu nại */}
            {(record.escalatedById || record.escalatedByName || record.escalatedByRole) && (
              <div className="mb-3">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-300">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <Text className="text-xs font-semibold text-purple-900">Người gửi khiếu nại</Text>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {record.escalatedByName && (
                      <div>
                        <Text type="secondary" className="text-xs">Tên</Text>
                        <div className="font-medium text-sm text-gray-900">
                          {record.escalatedByName}
                        </div>
                      </div>
                    )}
                    {record.escalatedByRole && (
                      <div>
                        <Text type="secondary" className="text-xs">Vai trò</Text>
                        <div>
                          <Tag color={record.escalatedByRole === 'SHOP' ? 'green' : 'blue'}>
                            {record.escalatedByRole === 'SHOP' ? 'Cửa hàng' : 'Khách hàng'}
                          </Tag>
                        </div>
                      </div>
                    )}
                    {record.escalatedById && (
                      <div>
                        <Text type="secondary" className="text-xs">ID</Text>
                        <div className="font-mono text-xs text-gray-600 truncate" title={record.escalatedById}>
                          {record.escalatedById}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <Text type="secondary" className="text-xs">Giá hoàn trả</Text>
                  <div className="font-semibold text-orange-600">{formatCurrency(record.itemPrice)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <Text type="secondary" className="text-xs">Ngày tạo</Text>
                  <div className="font-medium text-sm">{formatDate(record.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <div>
                  <Text type="secondary" className="text-xs">Lý do</Text>
                  <div className="font-medium text-sm truncate" title={record.reason}>
                    {record.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin khách hàng và cửa hàng */}
            <Divider className="!my-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Thông tin khách hàng */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <Text className="text-xs font-semibold text-blue-900">Thông tin khách hàng</Text>
                </div>
                <div className="space-y-1">
                  <div>
                    <Text type="secondary" className="text-xs">Tên khách hàng</Text>
                    <div className="font-medium text-sm text-gray-900">
                      {record.customerName || 'N/A'}
                    </div>
                  </div>
                  {record.customerLegalPoint !== undefined && (
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-yellow-600" />
                      <Text type="secondary" className="text-xs">Điểm uy tín: </Text>
                      <Text className="text-xs font-semibold text-yellow-600">
                        {record.customerLegalPoint}
                      </Text>
                    </div>
                  )}
                  <div>
                    <Text type="secondary" className="text-xs">ID khách hàng</Text>
                    <div className="font-mono text-xs text-gray-600 truncate" title={record.customerId}>
                      {record.customerId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin cửa hàng */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-green-600" />
                  <Text className="text-xs font-semibold text-green-900">Thông tin cửa hàng</Text>
                </div>
                <div className="space-y-1">
                  <div>
                    <Text type="secondary" className="text-xs">Tên cửa hàng</Text>
                    <div className="font-medium text-sm text-gray-900">
                      {record.storeName || 'N/A'}
                    </div>
                  </div>
                  {record.storeLegalPoint !== undefined && (
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-yellow-600" />
                      <Text type="secondary" className="text-xs">Điểm uy tín: </Text>
                      <Text className="text-xs font-semibold text-yellow-600">
                        {record.storeLegalPoint}
                      </Text>
                    </div>
                  )}
                  <div>
                    <Text type="secondary" className="text-xs">ID cửa hàng</Text>
                    <div className="font-mono text-xs text-gray-600 truncate" title={record.shopId}>
                      {record.shopId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin sản phẩm và vận chuyển */}
            {(record.orderCode || record.orderItemId || record.ghnOrderCode || record.trackingStatus || record.shippingFee !== null) && (
              <>
                <Divider className="!my-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  {record.orderCode && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <Text type="secondary" className="text-xs">Mã đơn hàng</Text>
                        <div className="font-mono text-xs font-semibold text-blue-700 truncate" title={record.orderCode}>
                          {record.orderCode}
                        </div>
                      </div>
                    </div>
                  )}
                  {record.orderItemId && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Package className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <Text type="secondary" className="text-xs">ID Item đơn hàng</Text>
                        <div className="font-mono text-xs text-gray-700 break-all" title={record.orderItemId}>
                          {record.orderItemId}
                        </div>
                      </div>
                    </div>
                  )}
                  {record.ghnOrderCode && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Truck className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <Text type="secondary" className="text-xs">Mã vận đơn GHN</Text>
                        <div className="font-mono text-xs text-gray-700 truncate" title={record.ghnOrderCode}>
                          {record.ghnOrderCode}
                        </div>
                      </div>
                    </div>
                  )}
                  {record.trackingStatus && record.trackingStatus !== 'CREATED_WAITING_SYNC' && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Truck className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <Text type="secondary" className="text-xs">Trạng thái vận chuyển</Text>
                        <div className="font-medium text-sm text-gray-700 truncate">
                          {record.trackingStatus}
                        </div>
                      </div>
                    </div>
                  )}
                  {record.shippingFee !== null && record.shippingFee !== undefined && (
                    <div className="flex items-start gap-2 min-w-0">
                      <DollarSign className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <Text type="secondary" className="text-xs">Phí vận chuyển</Text>
                        <div className="font-semibold text-sm text-gray-700">
                          {formatCurrency(record.shippingFee)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Thông tin kích thước đóng gói */}
            {(record.packageWeight || record.packageLength || record.packageWidth || record.packageHeight) && (
              <>
                <Divider className="!my-3" />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="w-4 h-4 text-gray-600" />
                    <Text className="text-xs font-semibold text-gray-900">Thông tin đóng gói</Text>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {record.packageWeight !== null && record.packageWeight !== undefined && (
                      <div>
                        <Text type="secondary" className="text-xs">Khối lượng (kg)</Text>
                        <div className="font-medium text-sm">{record.packageWeight}</div>
                      </div>
                    )}
                    {record.packageLength !== null && record.packageLength !== undefined && (
                      <div>
                        <Text type="secondary" className="text-xs">Chiều dài (cm)</Text>
                        <div className="font-medium text-sm">{record.packageLength}</div>
                      </div>
                    )}
                    {record.packageWidth !== null && record.packageWidth !== undefined && (
                      <div>
                        <Text type="secondary" className="text-xs">Chiều rộng (cm)</Text>
                        <div className="font-medium text-sm">{record.packageWidth}</div>
                      </div>
                    )}
                    {record.packageHeight !== null && record.packageHeight !== undefined && (
                      <div>
                        <Text type="secondary" className="text-xs">Chiều cao (cm)</Text>
                        <div className="font-medium text-sm">{record.packageHeight}</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Media Section */}
            {(hasRealImages || hasRealVideo) && (
              <div className="mb-3">
                <Divider className="!my-3" />
                <div className="flex flex-wrap gap-3">
                  {hasRealImages && (
                    <div className="flex items-center gap-2">
                      <ZoomIn className="w-4 h-4 text-gray-500" />
                      <Text className="text-xs font-medium text-gray-700">
                        Ảnh ({filteredImages.length})
                      </Text>
                      <div className="flex gap-2">
                        {filteredImages.slice(0, 3).map((url, idx) => (
                          <div
                            key={idx}
                            className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer"
                            onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: idx })}
                          >
                            <img
                              src={url}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {filteredImages.length > 3 && (
                          <div
                            className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-all"
                            onClick={() => setImagePreview({ visible: true, urls: filteredImages, current: 3 })}
                          >
                            <Text className="text-xs font-semibold text-gray-600">
                              +{filteredImages.length - 3}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {hasRealVideo && (
                    <div className="flex items-center gap-2">
                      <VideoIcon className="w-4 h-4 text-gray-500" />
                      <Text className="text-xs font-medium text-gray-700">Video</Text>
                      <div
                        className="w-24 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer"
                        onClick={() => setVideoPreview({ visible: true, url: rawVideo })}
                      >
                        <video
                          src={rawVideo}
                          className="w-full h-full object-cover"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        >
                          Trình duyệt không hỗ trợ video
                        </video>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <Card
        className="border-gray-200 shadow-sm mb-4"
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 24 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <Title level={4} className="!mb-1">
              Khiếu nại hoàn trả
            </Title>
            <Text type="secondary">
              Quản lý các khiếu nại hoàn trả đã được đưa lên sàn xử lý
            </Text>
          </div>
          <Space direction="vertical" size={0} className="text-right">
            <Text type="secondary" className="text-xs">
              Tổng số khiếu nại
            </Text>
            <Text strong>{total}</Text>
          </Space>
        </div>
      </Card>

      {isLoading ? (
        <div className="py-16 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải danh sách khiếu nại...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <Empty description="Chưa có khiếu nại nào" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.map((record) => renderDisputeCard(record))}
          </div>
          <div className="mt-6 flex justify-end">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={['5', '10', '20', '50']}
              onChange={onPageChange}
              showTotal={(t) => `Tổng ${t} khiếu nại`}
            />
          </div>
        </>
      )}

      {/* Image Preview Modal */}
      {imagePreview.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={() => setImagePreview({ visible: false, urls: [], current: 0 })}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={imagePreview.urls[imagePreview.current]}
              alt={`Image ${imagePreview.current + 1}`}
              className="w-full rounded-lg"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
            {imagePreview.urls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview((prev) => ({
                      ...prev,
                      current: (prev.current - 1 + prev.urls.length) % prev.urls.length,
                    }));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview((prev) => ({
                      ...prev,
                      current: (prev.current + 1) % prev.urls.length,
                    }));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {imagePreview.current + 1} / {imagePreview.urls.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {videoPreview.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={() => setVideoPreview({ visible: false, url: '' })}
        >
          <div className="relative max-w-4xl w-full">
            <video
              src={videoPreview.url}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: '70vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              Trình duyệt không hỗ trợ video
            </video>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-lg font-semibold">Giải quyết khiếu nại hoàn trả</span>
          </div>
        }
        open={showResolveModal.visible}
        onCancel={() => {
          if (resolvingId) return;
          setShowResolveModal({ visible: false, returnId: null });
          setAdminNote('');
          setFaultType('CUSTOMER');
          setRefundCustomer(true);
        }}
        footer={null}
        width={700}
        maskClosable={!resolvingId}
        closable={!resolvingId}
      >
        <div className="space-y-5 py-2">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Lưu ý quan trọng
                </p>
                <p className="text-sm text-blue-800">
                  Vui lòng xem xét kỹ khiếu nại và đưa ra quyết định công bằng. Quyết định này sẽ ảnh hưởng trực tiếp đến việc hoàn tiền cho khách hàng và có thể không thể hoàn tác.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Bên có lỗi <span className="text-red-500">*</span>
            </label>
            <Radio.Group
              value={faultType}
              onChange={(e) => {
                setFaultType(e.target.value);
                // Auto-set refundCustomer based on faultType
                if (e.target.value === 'CUSTOMER') {
                  setRefundCustomer(false);
                } else {
                  setRefundCustomer(true);
                }
              }}
              disabled={!!resolvingId}
              className="w-full"
            >
              <Space direction="vertical" size="middle" className="w-full">
                <Radio value="CUSTOMER" className="w-full">
                  <div className="ml-2">
                    <span className="font-medium text-gray-900">Khách hàng có lỗi</span>
                    <p className="text-xs text-gray-500 mt-0.5">Sản phẩm không đúng mô tả từ phía khách hàng, khách hàng làm hỏng sản phẩm, v.v.</p>
                  </div>
                </Radio>
                <Radio value="SHOP" className="w-full">
                  <div className="ml-2">
                    <span className="font-medium text-gray-900">Cửa hàng có lỗi</span>
                    <p className="text-xs text-gray-500 mt-0.5">Sản phẩm lỗi từ nhà sản xuất, giao sai sản phẩm, mô tả không đúng, v.v.</p>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quyết định của ADMIN <span className="text-red-500">*</span>
            </label>
            <Radio.Group
              value={refundCustomer}
              onChange={(e) => setRefundCustomer(e.target.value)}
              disabled={!!resolvingId}
              className="w-full"
            >
              <Space direction="vertical" size="middle" className="w-full">
                <Radio value={true} className="w-full">
                  <div className="ml-2">
                    <span className="font-medium text-green-700">Có hoàn tiền cho khách hàng</span>
                  
                  </div>
                </Radio>
                <Radio value={false} className="w-full">
                  <div className="ml-2">
                    <span className="font-medium text-red-700">Không hoàn tiền cho khách hàng</span>
                  
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
            
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ghi chú của admin <span className="text-red-500">*</span>
            </label>
            <TextArea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập ghi chú giải thích quyết định của bạn. Ví dụ: Sản phẩm bị lỗi từ nhà sản xuất, khách hàng đã được thông báo và đồng ý hoàn tiền..."
              rows={5}
              maxLength={1000}
              showCount
              disabled={!!resolvingId}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ghi chú này sẽ được lưu lại trong hệ thống để tham khảo và audit sau này. Vui lòng mô tả rõ ràng lý do quyết định.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              size="large"
              onClick={() => {
                if (resolvingId) return;
                setShowResolveModal({ visible: false, returnId: null });
                setAdminNote('');
                setFaultType('CUSTOMER');
                setRefundCustomer(true);
              }}
              disabled={!!resolvingId}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleResolve}
              disabled={!!resolvingId || !adminNote.trim()}
              loading={!!resolvingId}
              className="min-w-[160px]"
            >
              {resolvingId ? 'Đang xử lý...' : 'Xác nhận giải quyết'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReturnDisputesList;
