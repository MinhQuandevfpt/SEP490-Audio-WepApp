import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerOrder, ReviewMediaPayload, OrderItem } from '../../types/api';
import { getStatusLabel, getStatusBadgeStyle, formatCurrency, formatDate, canCancelOrder } from '../../utils/orderStatus';
import { Package, Calendar, MapPin, Phone, Truck, Receipt, Copy, Check, ExternalLink, ShoppingBag, Star, Plus, Image as ImageIcon, Video, X, ChevronRight } from 'lucide-react';
import { Card, Button, message, Select, Input } from 'antd';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';
import { ReviewService } from '../../services/customer/ReviewService';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import { ProductReviewService } from '../../services/customer/ProductReviewService';
import { FileUploadService } from '../../services/FileUploadService';
import ReturnRequestModal from './ReturnRequestModal';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  order: CustomerOrder;
  ghnOrderData?: Record<string, any>;
  onOrderCancelled?: () => void;
}

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.message ||
    error?.data?.message ||
    (Array.isArray(error?.errors) ? error.errors[0] : null) ||
    fallback
  );
};

const resolveOrderItemImage = (item: Partial<OrderItem>) => {
  if (item.variantId) {
    return item.variantUrl || item.image || undefined;
  }
  return item.image || item.variantUrl || undefined;
};

const formatVariantLabel = (item: { variantOptionName?: string | null; variantOptionValue?: string | null }) => {
  if (!item.variantOptionName || !item.variantOptionValue) return null;
  return `${item.variantOptionName}: ${item.variantOptionValue}`;
};

const isAlreadyReviewedError = (error: any): boolean => {
  const code = error?.data?.code || error?.code;
  if (code && typeof code === 'string' && code.toUpperCase().includes('REVIEW')) {
    return true;
  }

  const message =
    (error?.message ||
      error?.data?.message ||
      (Array.isArray(error?.errors) ? error.errors[0] : '') ||
      '') as string;

  return typeof message === 'string' && message.toLowerCase().includes('đã review');
};

const OrderCard: React.FC<Props> = ({ order, ghnOrderData = {}, onOrderCancelled }) => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedGhnCode, setCopiedGhnCode] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<ReviewableItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewMedia, setReviewMedia] = useState<Array<ReviewMediaPayload & { file?: File | null; preview?: string | null }>>([
    { type: 'image', url: '', file: null, preview: null },
  ]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedItemIds, setReviewedItemIds] = useState<string[]>([]);
  const [loadingReviewStatus, setLoadingReviewStatus] = useState<Record<string, boolean>>({});
  const [cancelReason, setCancelReason] = useState<string>('CHANGE_OF_MIND');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const displayOrderCode = order.orderCode ?? ' - ';
  const statusStyle = getStatusBadgeStyle(order.status);
  const formattedDate = formatDate(order.createdAt);
  const isDeliverySuccess = order.status === 'DELIVERY_SUCCESS';

  type LegacyOrderWithItems = CustomerOrder & { items?: Array<OrderItem & { storeName?: string | null }> };
  const storeOrders = Array.isArray(order.storeOrders) ? order.storeOrders : [];
  const legacyItems = Array.isArray((order as LegacyOrderWithItems).items) ? (order as LegacyOrderWithItems).items : [];

  type ReviewableItem = {
    id: string;
    name: string;
    image?: string;
    storeName: string;
    productRefId: string;
  variantOptionName?: string | null;
  variantOptionValue?: string | null;
  };

  const reviewableItems: ReviewableItem[] = useMemo(() => {
    if (storeOrders.length > 0) {
      return storeOrders.flatMap((storeOrder) => {
        const items = storeOrder.items ?? [];
        return items
          .filter((item) => item.type === 'PRODUCT')
          .map((item) => ({
            id: item.id,
            name: item.name,
            image: resolveOrderItemImage(item),
            storeName: storeOrder.storeName,
            productRefId: item.refId || item.id || '',
            variantOptionName: item.variantOptionName,
            variantOptionValue: item.variantOptionValue,
          }));
      });
    }

    // Fallback for legacy API response where items exist at root level
    if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
      return [];
    }
    return legacyItems
      .filter((item) => item.type === 'PRODUCT')
      .map((item) => ({
        id: item.id,
        name: item.name,
        image: resolveOrderItemImage(item),
        storeName: item.storeName ?? 'Cửa hàng',
        productRefId: item.refId || item.id || '',
        variantOptionName: item.variantOptionName,
        variantOptionValue: item.variantOptionValue,
      }));
  }, [storeOrders, legacyItems]);

  const resetReviewForm = () => {
    setSelectedReviewItem(null);
    setReviewRating(5);
    setReviewContent('');
    setReviewMedia([{ type: 'image', url: '', file: null, preview: null }]);
  };

  const handleSelectReviewItem = (item: ReviewableItem) => {
    const productId = item.productRefId;
    if (!productId) {
      setSelectedReviewItem(item);
      setReviewRating(5);
      setReviewContent('');
      setReviewMedia([{ type: 'image', url: '', file: null, preview: null }]);
      return;
    }

    if (reviewedItemIds.includes(productId)) {
      message.info('Bạn đã đánh giá sản phẩm này rồi.');
      return;
    }

    setLoadingReviewStatus((prev) => ({ ...prev, [productId]: true }));

    ProductReviewService.getProductReviewStatus(productId, order.id)
      .then((status) => {
        if (status.hasReviewed) {
          setReviewedItemIds((prev) => Array.from(new Set([...prev, productId])));
          message.info(status.message || 'Sản phẩm trong đơn hàng này đã được đánh giá.');
        } else {
          setSelectedReviewItem(item);
          setReviewRating(5);
          setReviewContent('');
          setReviewMedia([{ type: 'image', url: '', file: null, preview: null }]);
        }
      })
      .catch((error: any) => {
        console.error('Error checking existing review status:', error);
        // Nếu API trạng thái lỗi, vẫn cho phép mở form để tránh chặn người dùng
        setSelectedReviewItem(item);
        setReviewRating(5);
        setReviewContent('');
        setReviewMedia([{ type: 'image', url: '', file: null, preview: null }]);
      })
      .finally(() => {
        setLoadingReviewStatus((prev) => {
          const { [productId]: _, ...rest } = prev;
          return rest;
        });
      });
  };

  // Pre-load review status for all items in this order when card is mounted / reloaded
  useEffect(() => {
    if (!isDeliverySuccess || reviewableItems.length === 0) return;

    const uncheckedProductIds = Array.from(
      new Set(
        reviewableItems
          .map((item) => item.productRefId)
          .filter((id): id is string => !!id && !reviewedItemIds.includes(id)),
      ),
    );

    if (uncheckedProductIds.length === 0) return;

    const loadStatuses = async () => {
      try {
        await Promise.all(
          uncheckedProductIds.map(async (productId) => {
            try {
              const status = await ProductReviewService.getProductReviewStatus(productId, order.id);
              if (status.hasReviewed) {
                setReviewedItemIds((prev) => Array.from(new Set([...prev, productId])));
              }
            } catch (error) {
              console.error('Failed to preload review status for product', productId, error);
            }
          }),
        );
      } catch (e) {
        console.error('Error preloading review statuses:', e);
      }
    };

    loadStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeliverySuccess, reviewableItems, order.id]);

  const hasPendingReviewItems = useMemo(
    () =>
      reviewableItems.some(
        (item) => item.productRefId && !reviewedItemIds.includes(item.productRefId),
      ),
    [reviewableItems, reviewedItemIds],
  );

  const handleMediaChange = (index: number, field: keyof ReviewMediaPayload, value: string) => {
    setReviewMedia((prev) =>
      prev.map((media, i) => (i === index ? { ...media, [field]: value } : media))
    );
  };

  const handleMediaFileChange = (index: number, file: File | null) => {
    setReviewMedia((prev) =>
      prev.map((media, i) =>
        i === index
          ? {
              ...media,
              file,
              preview: file ? URL.createObjectURL(file) : null,
              url: file ? file.name : '',
            }
          : media
      )
    );
  };

  const addMediaField = () => {
    setReviewMedia((prev) => [...prev, { type: 'image', url: '', file: null, preview: null }]);
  };

  const removeMediaField = (index: number) => {
    setReviewMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      if (order.status === 'AWAITING_SHIPMENT') {
        await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
        message.success('Yêu cầu hủy đơn hàng đã được gửi đến cửa hàng.');
      } else {
        await OrderHistoryService.cancel(order.id, cancelReason, cancelNote);
        message.success('Hủy đơn hàng thành công');
      }
      setShowCancelModal(false);
      setCancelReason('CHANGE_OF_MIND');
      setCancelNote('');
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, 'Hủy đơn hàng thất bại'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedReviewItem) {
      message.warning('Vui lòng chọn sản phẩm để đánh giá');
      return;
    }
    if (!reviewRating) {
      message.warning('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (!reviewContent.trim()) {
      message.warning('Vui lòng nhập nội dung đánh giá');
      return;
    }

    const mediaPayload = (
      await Promise.all(
        reviewMedia.map(async (media) => {
          if (media.file) {
            try {
              const uploaded = await FileUploadService.uploadImage(media.file);
              return { type: media.type, url: uploaded.url };
            } catch (uploadError: any) {
              message.error(uploadError?.message || 'Tải media thất bại, vui lòng thử lại');
              throw uploadError;
            }
          }
          if (media.url.trim()) {
            return { type: media.type, url: media.url.trim() };
          }
          return null;
        })
      )
    ).filter((m): m is ReviewMediaPayload => Boolean(m));

    try {
      setIsSubmittingReview(true);
      await ReviewService.createReview({
        customerOrderItemId: selectedReviewItem.id,
        rating: reviewRating,
        content: reviewContent.trim(),
        media: mediaPayload.length > 0 ? mediaPayload : undefined,
      });
      showCenterSuccess('Đánh giá sản phẩm thành công');
      if (selectedReviewItem.productRefId) {
        setReviewedItemIds((prev) => Array.from(new Set([...prev, selectedReviewItem.productRefId])));
      }
      resetReviewForm();
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Không thể gửi đánh giá, vui lòng thử lại');
      showCenterError(errMsg, 'Gửi đánh giá thất bại');

      if (selectedReviewItem?.productRefId && isAlreadyReviewedError(err)) {
        setReviewedItemIds((prev) =>
          Array.from(new Set([...prev, selectedReviewItem.productRefId])),
        );
        resetReviewForm();
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <Card
      className="order-card bg-white"
      styles={{
        body: { padding: 0 },
      }}
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 18px rgba(0,0,0,0.07)',
        transition: 'all 0.3s ease',
        borderTop: '3px solid #FF6A00',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      }}
    >
      <div className="flex flex-col gap-4 p-4 md:p-5 lg:flex-row">
        {/* Left column */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div 
            className="rounded-2xl border border-orange-100 bg-[#FFF4EC] p-4 cursor-pointer transition-all hover:bg-[#FFE8D6] hover:shadow-md"
            onClick={() => navigate(`/orders/${order.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/orders/${order.id}`);
              }
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-gray-900">
                <Package className="w-4 h-4 text-[#FF6A00]" />
                <p className="text-sm font-semibold uppercase tracking-wide text-[#FF6A00]">MÃ ĐƠN</p>
                <p className="text-base font-bold">{displayOrderCode}</p>
              </div>
              <div className="flex flex-col items-start gap-1 text-xs text-gray-500 md:items-end">
                <span style={statusStyle}>{getStatusLabel(order.status)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order.id}`);
                  }}
                  className="flex items-center gap-1 text-[#FF6A00] hover:text-orange-600 font-medium mt-1 transition-colors"
                >
                  Xem chi tiết
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Store orders */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-sm font-semibold text-gray-900">
                Sản phẩm
              </h3>
            </div>

            <div className="space-y-4">
              {storeOrders.map((storeOrder) => (
                <div key={storeOrder.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                    <span style={getStatusBadgeStyle(storeOrder.status)} className="text-xs">
                      {getStatusLabel(storeOrder.status)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Array.isArray(storeOrder.items) && storeOrder.items.length > 0 ? (
                      storeOrder.items.map((item) => {
                        const itemImage = resolveOrderItemImage(item);
                        return (
                          <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                              {itemImage ? (
                                <img src={itemImage} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-full w-full p-3 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                            {formatVariantLabel(item) && (
                              <p className="text-xs text-gray-500">{formatVariantLabel(item)}</p>
                            )}
                              <p className="text-xs text-gray-500">
                                {formatCurrency(item.unitPrice)} · SL {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Không có sản phẩm</p>
                    )}
                  </div>

                  {ghnOrderData[storeOrder.id]?.orderGhn && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">
                        GHN: {ghnOrderData[storeOrder.id].orderGhn}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(ghnOrderData[storeOrder.id].orderGhn);
                            setCopiedGhnCode(storeOrder.id);
                            setTimeout(() => setCopiedGhnCode(null), 2000);
                            message.success('Đã sao chép mã vận đơn');
                          } catch {
                            message.error('Không thể sao chép');
                          }
                        }}
                        className="rounded-full p-1 text-blue-500 hover:bg-blue-100"
                      >
                        {copiedGhnCode === storeOrder.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://donhang.ghn.vn/?order_code=${ghnOrderData[storeOrder.id].orderGhn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 font-semibold text-blue-600"
                      >
                        Theo dõi
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isDeliverySuccess && reviewableItems.length > 0 && hasPendingReviewItems && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Star className="w-4 h-4 text-[#FF6A00]" />
                <h4 className="text-sm font-semibold text-gray-900">Đánh giá sản phẩm</h4>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-[#FF6A00]">
                  Đơn đã giao thành công
                </span>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Gửi đánh giá để nhận thêm ưu đãi và giúp những khách hàng khác lựa chọn tốt hơn.
              </p>

              <div className="space-y-3">
                {reviewableItems.map((item) => {
                  const productId = item.productRefId;
                  const reviewed = reviewedItemIds.includes(productId);
                  const isChecking = loadingReviewStatus[productId];
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-full w-full p-2 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                        {formatVariantLabel(item) && (
                          <p className="text-xs text-gray-500">{formatVariantLabel(item)}</p>
                        )}
                        <p className="text-xs text-gray-500">{item.storeName}</p>
                      </div>
                      <Button
                        type="primary"
                        disabled={reviewed || isChecking}
                        onClick={() => handleSelectReviewItem(item)}
                        loading={isChecking}
                        style={{
                          backgroundColor: reviewed ? '#D1D5DB' : '#FF6A00',
                          borderColor: reviewed ? '#D1D5DB' : '#FF6A00',
                          borderRadius: '999px',
                          fontWeight: 600,
                        }}
                      >
                        {reviewed ? 'Đã đánh giá' : 'Đánh giá'}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {selectedReviewItem && (
                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Đánh giá sản phẩm</p>
                      <p className="text-xs text-gray-500">{selectedReviewItem.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetReviewForm}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                      Đóng
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-gray-700">Chọn số sao</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= reviewRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="rounded-full border border-orange-200 bg-white p-1.5"
                          >
                            <Star
                              className="h-5 w-5"
                              fill={active ? '#FFB703' : 'transparent'}
                              color={active ? '#FFB703' : '#D1D5DB'}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-gray-700">Cảm nhận của bạn</p>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                      rows={4}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Chia sẻ về chất lượng, âm thanh, đóng gói..."
                    />
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700">Hình ảnh / Video (tùy chọn)</p>
                      <button
                        type="button"
                        onClick={addMediaField}
                        className="flex items-center gap-1 text-xs font-medium text-[#FF6A00]"
                      >
                        <Plus className="h-3 w-3" />
                        Thêm media
                      </button>
                    </div>
                    <div className="space-y-3">
                      {reviewMedia.map((media, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {media.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            <select
                              value={media.type}
                              onChange={(e) => handleMediaChange(index, 'type', e.target.value)}
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-orange-400 focus:outline-none"
                            >
                              <option value="image">Hình ảnh</option>
                              <option value="video">Video</option>
                            </select>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              {media.file ? media.file.name : 'Chưa chọn tệp'}
                            </span>
                            {reviewMedia.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMediaField(index)}
                                className="ml-auto text-xs text-red-500 hover:text-red-600"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                          <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500 cursor-pointer hover:border-orange-300 hover:text-orange-500 transition-colors">
                            <input
                              type="file"
                              accept={media.type === 'image' ? 'image/*' : 'video/*'}
                              className="hidden"
                              onChange={(e) => handleMediaFileChange(index, e.target.files?.[0] || null)}
                            />
                            <span className="font-medium">Nhấp để tải {media.type === 'image' ? 'ảnh' : 'video'}</span>
                            <span className="text-[11px] text-gray-400">Hỗ trợ file tối đa 10MB</span>
                            {media.preview && media.type === 'image' && (
                              <img src={media.preview} alt="preview" className="mt-2 h-20 w-auto rounded-lg object-cover" />
                            )}
                            {media.preview && media.type === 'video' && (
                              <video src={media.preview} controls className="mt-2 h-20 rounded-lg" />
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 space-y-1 text-xs text-gray-500">
                    <p>• Đánh giá sẽ được kiểm duyệt trước khi hiển thị công khai.</p>
                    <p>• Link media cần ở chế độ công khai.</p>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <Button className="flex-1" onClick={resetReviewForm} disabled={isSubmittingReview}>
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      className="flex-1"
                      loading={isSubmittingReview}
                      onClick={handleSubmitReview}
                      style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
                    >
                      Gửi đánh giá
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-full space-y-4 md:w-80 lg:w-96">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6A00]" />
              <h4 className="text-sm font-semibold text-gray-900">Địa chỉ giao hàng</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {order.receiverName} · {order.phoneNumber}
              </p>
              <p>{order.addressLine}</p>
              <p className="text-xs text-gray-500">
                {order.street}, {order.ward}, {order.district}, {order.province}
              </p>
              {order.note && (
                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">Ghi chú: {order.note}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-orange-50/60 to-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6A00]" />
              <h4 className="text-sm font-semibold text-gray-900">Tóm tắt đơn hàng</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(order.shippingFeeTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-orange-200 pt-2 text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-[#FF6A00]">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Thao tác</h4>
            <div className="space-y-2">
              {order.status === 'SHIPPING' && (
                <Button
                  type="primary"
                  icon={<Truck className="w-4 h-4" />}
                  className="h-10 w-full"
                  style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00', borderRadius: '10px' }}
                >
                  Theo dõi đơn hàng
                </Button>
              )}
              {order.status === 'COMPLETED' && (
                <>
                  <Button
                    type="primary"
                    className="h-10 w-full"
                    style={{ backgroundColor: '#27AE60', borderColor: '#27AE60', borderRadius: '10px' }}
                  >
                    Đánh giá sản phẩm
                  </Button>
                  <Button className="h-10 w-full" style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}>
                    Yêu cầu đổi trả
                  </Button>
                </>
              )}
              {order.status === 'DELIVERY_SUCCESS' && (
                <Button
                  className="h-10 w-full"
                  style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                  onClick={() => setShowReturnModal(true)}
                >
                  Hoàn trả sản phẩm
                </Button>
              )}
              {canCancelOrder(order.status) && (
                <Button danger className="h-10 w-full" style={{ borderRadius: '10px' }} onClick={() => setShowCancelModal(true)}>
                  {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                </Button>
              )}
              {order.status === 'UNPAID' && (
                <Button
                  type="primary"
                  className="h-10 w-full"
                  style={{ backgroundColor: '#2D9CDB', borderColor: '#2D9CDB', borderRadius: '10px' }}
                >
                  Thanh toán ngay
                </Button>
              )}
              {order.status === 'RETURN_REQUESTED' && (
                <Button
                  className="h-10 w-full"
                  style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                  onClick={() => navigate(`/returns`)}
                >
                  Xem trạng thái hoàn trả
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isCancelling && setShowCancelModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Bạn có chắc chắn muốn {order.status === 'AWAITING_SHIPMENT' ? 'gửi yêu cầu hủy' : 'hủy'} đơn hàng này không?
            </p>

            {/* Lý do hủy */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Lý do hủy</p>
              <Select
                value={cancelReason}
                onChange={setCancelReason}
                className="w-full"
                size="large"
                style={{ borderRadius: 8 }}
              >
                <Option value="CHANGE_OF_MIND">Đổi ý</Option>
                <Option value="FOUND_BETTER_PRICE">Tìm giá tốt hơn</Option>
                <Option value="WRONG_INFO_OR_ADDRESS">Sai thông tin/địa chỉ</Option>
                <Option value="ORDERED_BY_ACCIDENT">Đặt nhầm</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </div>

            {/* Ghi chú */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Ghi chú</p>
              <TextArea
                rows={3}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="VD: Đặt nhầm phiên bản, muốn đổi sang sản phẩm khác..."
                style={{ borderRadius: 8 }}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  if (!isCancelling) {
                    setShowCancelModal(false);
                    setCancelReason('CHANGE_OF_MIND');
                    setCancelNote('');
                  }
                }}
                disabled={isCancelling}
              >
                Đóng
              </Button>
              <Button danger className="flex-1" loading={isCancelling} onClick={handleCancelOrder}>
                {order.status === 'AWAITING_SHIPMENT' ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ReturnRequestModal
        open={showReturnModal}
        order={order}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => {
          onOrderCancelled?.();
          setShowReturnModal(false);
        }}
      />
    </Card>
  );
};

export default OrderCard;
