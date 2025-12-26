import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTransition } from 'react';
import type { CustomerOrder, ReviewMediaPayload, OrderItem } from '../../types/api';
import { getStatusLabel, getStatusBadgeStyle, formatCurrency, formatDate, canCancelOrder } from '../../utils/orderStatus';
import { Package, Calendar, MapPin, Phone, Truck, Receipt, Copy, Check, ExternalLink, ShoppingBag, Star, Plus, Image as ImageIcon, Video, X, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { Card, Button, message, Select, Input, Tag } from 'antd';
import { OrderHistoryService } from '../../services/customer/OrderHistoryService';
import { ReviewService } from '../../services/customer/ReviewService';
import { showCenterError, showCenterSuccess } from '../../utils/notification';
import { ProductReviewService } from '../../services/customer/ProductReviewService';
import { FileUploadService } from '../../services/FileUploadService';
import ReturnRequestModal from './ReturnRequestModal';
import CustomerCartService from '../../services/customer/CartService';
import { ShippingService, type GhnLeadtimeResponseData } from '../../services/customer/ShippingService';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { useProvinces } from '../../hooks/useProvinces';
import { useDistricts } from '../../hooks/useDistricts';
import { useWards } from '../../hooks/useWards';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  order: CustomerOrder;
  ghnOrderData?: Record<string, any>;
  onOrderCancelled?: () => void;
}

const CHECKOUT_SESSION_KEY = 'checkout:payload:v1';

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

// Helper function to translate cancel reason to Vietnamese
const translateCancelReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    'FOUND_BETTER_PRICE': 'Tìm thấy giá tốt hơn',
    'CHANGE_OF_MIND': 'Đổi ý',
    'WRONG_ITEM': 'Sai sản phẩm',
    'DELIVERY_ISSUE': 'Vấn đề giao hàng',
    'WRONG_INFO_OR_ADDRESS': 'Sai thông tin/địa chỉ',
    'ORDERED_BY_ACCIDENT': 'Đặt nhầm',
    'OTHER': 'Khác',
  };
  return reasonMap[reason] || reason;
};

// Helper function to translate cancel request status to Vietnamese
const translateCancelRequestStatus = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    'REQUESTED': { label: 'Đang chờ xử lý', color: 'orange' },
    'APPROVED': { label: 'Đã chấp nhận', color: 'green' },
    'REJECTED': { label: 'Đã từ chối', color: 'red' },
  };
  return statusMap[status] || { label: status, color: 'default' };
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

const OrderCardComponent: React.FC<Props> = ({ order, ghnOrderData = {}, onOrderCancelled }) => {
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
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
  const [showCancelShippingModal, setShowCancelShippingModal] = useState(false);
  const [isCancellingShipping, setIsCancellingShipping] = useState(false);
  
  // Store leadtime data: Map<storeOrderId, GhnLeadtimeResponseData>
  const [storeLeadtimes, setStoreLeadtimes] = useState<Record<string, GhnLeadtimeResponseData>>({});
  const [storeLeadtimesLoading, setStoreLeadtimesLoading] = useState<Set<string>>(new Set());
  
  // Cancel requests data
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [loadingCancelRequests, setLoadingCancelRequests] = useState(false);
  
  // Product cache để lấy store address và weight
  const [productCache, setProductCache] = useState<Map<string, Product>>(() => new Map());
  
  // Hooks để convert customer address
  const { provinces } = useProvinces();
  const customerProvince = useMemo(() => {
    return provinces.find(p => 
      p.ProvinceName.toLowerCase().includes(order.province.toLowerCase()) ||
      order.province.toLowerCase().includes(p.ProvinceName.toLowerCase())
    );
  }, [provinces, order.province]);
  const { districts } = useDistricts(customerProvince?.ProvinceID || null);
  const customerDistrict = useMemo(() => {
    if (!districts.length) return null;
    return districts.find(d => 
      d.DistrictName.toLowerCase().includes(order.district.toLowerCase()) ||
      order.district.toLowerCase().includes(d.DistrictName.toLowerCase())
    );
  }, [districts, order.district]);
  const { wards } = useWards(customerDistrict?.DistrictID || null);
  const customerWard = useMemo(() => {
    if (!wards.length) return null;
    return wards.find(w => 
      w.WardName.toLowerCase().includes(order.ward.toLowerCase()) ||
      order.ward.toLowerCase().includes(w.WardName.toLowerCase())
    );
  }, [wards, order.ward]);

  const displayOrderCode = order.orderCode ?? ' - ';
  const statusStyle = getStatusBadgeStyle(order.status);
  const formattedDate = formatDate(order.createdAt);
  const isDeliverySuccess = order.status === 'DELIVERY_SUCCESS';
  const isAwaitingShipment = order.status === 'AWAITING_SHIPMENT';

  type LegacyOrderWithItems = CustomerOrder & { items?: Array<OrderItem & { storeName?: string | null }> };
  const storeOrders = Array.isArray(order.storeOrders) ? order.storeOrders : [];
  const legacyItems = Array.isArray((order as LegacyOrderWithItems).items) ? (order as LegacyOrderWithItems).items : [];
  
  // Kiểm tra xem có GHN code không
  const hasGhnCode = useMemo(() => {
    return storeOrders.some(storeOrder => ghnOrderData[storeOrder.id]?.orderGhn);
  }, [storeOrders, ghnOrderData]);
  
  // Kiểm tra điều kiện hiển thị button "Yêu cầu hủy giao hàng"
  const canCancelShipping = isAwaitingShipment && hasGhnCode;

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
          startTransition(() => {
            setReviewedItemIds((prev) => Array.from(new Set([...prev, productId])));
          });
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

  // Helper: tính serviceTypeId cho storeOrder dựa trên trọng lượng
  const calculateStoreOrderServiceType = (
    items: OrderItem[],
    storeId: string,
    productCache: Map<string, Product>
  ): 2 | 5 => {
    let totalWeightGr = 0;
    items.forEach((item) => {
      if (item.type !== 'PRODUCT') return;
      const product = productCache.get(item.refId);
      if (!product || product.storeId !== storeId) return;
      const weightKg = product.weight && product.weight > 0 ? product.weight : 0.5;
      totalWeightGr += Math.round(weightKg * 1000) * item.quantity;
    });
    // ≤ 7500g → service_type_id = 2 (Hàng nhẹ), > 7500g → 5 (Hàng nặng)
    return totalWeightGr <= 7500 ? 2 : 5;
  };

  // Load product details để lấy store address và weight (tuần tự để tránh lag UI)
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = Array.from(
        new Set(
          storeOrders
            .flatMap(so => so.items || [])
            .filter(item => item.type === 'PRODUCT')
            .map(item => item.refId)
            .filter((id): id is string => !!id && !productCache.has(id))
        )
      );

      if (productIds.length === 0) return;

      // Load tuần tự với delay giữa mỗi call để tránh lag UI
      const next = new Map(productCache);
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        try {
          const res = await ProductListService.getProductById(productId);
          if (res.data) {
            next.set(res.data.productId, res.data);
          }
        } catch (error) {
          console.error(`Failed to fetch product ${productId}:`, error);
        }

        // Delay 300ms giữa mỗi API call để tránh lag UI (tăng từ 200ms)
        if (i < productIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Chỉ update state nếu có product mới - dùng startTransition để không block UI
      if (next.size > productCache.size) {
        startTransition(() => {
          setProductCache(next);
        });
      }
    };

    if (storeOrders.length > 0) {
      void loadProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeOrders]); // Loại bỏ productCache khỏi dependencies để tránh infinite loop

  const cancelRequestsRef = useRef<any[]>([]);

  // Initial load với loading state
  useEffect(() => {
    const loadCancelRequestsWithLoading = async () => {
      try {
        setLoadingCancelRequests(true);
        const requests = await OrderHistoryService.getCancelRequests(order.id);
        startTransition(() => {
          setCancelRequests(requests);
          cancelRequestsRef.current = requests;
        });
      } catch (error) {
        console.error('Failed to load cancel requests:', error);
        startTransition(() => {
          setCancelRequests([]);
          cancelRequestsRef.current = [];
        });
      } finally {
        setLoadingCancelRequests(false);
      }
    };

    loadCancelRequestsWithLoading();
  }, [order.id]);

  // Load leadtime cho mỗi storeOrder khi có đủ thông tin
  useEffect(() => {
    if (storeOrders.length === 0) return;
    
    // Cần có customer address đã convert được
    if (!customerDistrict || !customerWard) {
      return;
    }

    const toDistrictId = customerDistrict.DistrictID;
    const toWardCode = customerWard.WardCode;

    // Chuẩn bị danh sách các storeOrder cần load leadtime
    const leadtimeTasks: Array<{
      storeOrderId: string;
      fromDistrictId: number;
      storeWardCode: string;
      serviceId: number;
    }> = [];

    storeOrders.forEach((storeOrder) => {
      // Kiểm tra xem đã load chưa hoặc đang load
      if (storeLeadtimes[storeOrder.id] || storeLeadtimesLoading.has(storeOrder.id)) {
        return;
      }

      // Lấy thông tin store address từ product đầu tiên trong storeOrder
      const firstProductItem = storeOrder.items?.find((item) => item.type === 'PRODUCT');
      if (!firstProductItem) return;

      const product = productCache.get(firstProductItem.refId);
      if (!product) return;

      // Lấy districtCode và wardCode từ store
      const storeDistrictCode = product.store?.districtCode || product.districtCode;
      const storeWardCode = product.store?.wardCode || product.wardCode;

      if (!storeDistrictCode || !storeWardCode) {
        console.warn(`[OrderCard] Missing store address info for storeOrder ${storeOrder.id}`);
        return;
      }

      // Convert districtCode (string) to district_id (number)
      const fromDistrictId = parseInt(storeDistrictCode, 10);
      if (isNaN(fromDistrictId)) {
        console.warn(`[OrderCard] Invalid districtCode for storeOrder ${storeOrder.id}: ${storeDistrictCode}`);
        return;
      }

      // Tính serviceTypeId cho storeOrder này
      const serviceTypeId = calculateStoreOrderServiceType(
        storeOrder.items || [],
        storeOrder.storeId,
        productCache
      );

      // Map serviceTypeId to service_id: 2 -> 53322, 5 -> 100039
      const serviceId = serviceTypeId === 2 ? 53322 : 100039;

      leadtimeTasks.push({
        storeOrderId: storeOrder.id,
        fromDistrictId,
        storeWardCode,
        serviceId,
      });
    });

    // Gọi API leadtime tuần tự với delay giữa mỗi call để tránh lag UI
    if (leadtimeTasks.length > 0) {
      (async () => {
        for (let i = 0; i < leadtimeTasks.length; i++) {
          const task = leadtimeTasks[i];
          
          // Set loading state - dùng startTransition để không block UI
          startTransition(() => {
            setStoreLeadtimesLoading((prev) => new Set(prev).add(task.storeOrderId));
          });

          try {
            const response = await ShippingService.getGhnLeadtime({
              from_district_id: task.fromDistrictId,
              from_ward_code: task.storeWardCode,
              to_district_id: toDistrictId,
              to_ward_code: toWardCode,
              service_id: task.serviceId,
            });

            if (response.code === 200 && response.data) {
              // Dùng startTransition để không block UI khi update leadtime
              startTransition(() => {
                setStoreLeadtimes((prev) => ({
                  ...prev,
                  [task.storeOrderId]: response.data,
                }));
              });
            }
          } catch (error) {
            console.error(`[OrderCard] Failed to get leadtime for storeOrder ${task.storeOrderId}:`, error);
          } finally {
            // Dùng startTransition cho loading state updates
            startTransition(() => {
              setStoreLeadtimesLoading((prev) => {
                const next = new Set(prev);
                next.delete(task.storeOrderId);
                return next;
              });
            });

            // Delay 500ms giữa mỗi API call để tránh lag UI (tăng từ 300ms)
            if (i < leadtimeTasks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      })();
    }
  }, [storeOrders, productCache, customerDistrict, customerWard]); // Loại bỏ storeLeadtimes và storeLeadtimesLoading khỏi dependencies để tránh re-run không cần thiết

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
        // Load tuần tự với delay giữa mỗi call để tránh lag UI
        for (let i = 0; i < uncheckedProductIds.length; i++) {
          const productId = uncheckedProductIds[i];
          try {
            const status = await ProductReviewService.getProductReviewStatus(productId, order.id);
            if (status.hasReviewed) {
              // Dùng startTransition để không block UI khi update review status
              startTransition(() => {
                setReviewedItemIds((prev) => Array.from(new Set([...prev, productId])));
              });
            }
          } catch (error) {
            console.error('Failed to preload review status for product', productId, error);
          }

          // Delay 300ms giữa mỗi API call để tránh lag UI (tăng từ 200ms)
          if (i < uncheckedProductIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
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

  const handleBuyAgain = async () => {
    try {
      if (!CustomerCartService.isAuthenticated()) {
        // Lưu URL hiện tại để quay lại sau khi đăng nhập
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/auth/login');
        return;
      }

      // Lấy tất cả item trong đơn (ưu tiên storeOrders, fallback legacy items)
      const allItems: OrderItem[] =
        storeOrders.length > 0
          ? (storeOrders.flatMap((so) => so.items || []) as OrderItem[])
          : (legacyItems as OrderItem[]);

      if (!allItems || allItems.length === 0) {
        showCenterError('Không tìm thấy sản phẩm trong đơn hàng để mua lại.', 'Lỗi');
        return;
      }

      // Xóa giỏ hàng hiện tại trước khi mua lại (bỏ qua lỗi nếu có)
      try {
        await CustomerCartService.deleteCart();
      } catch (e) {
        console.warn('⚠️ [REORDER] Failed to clear cart before re-order:', e);
      }

      // Build payload addToCart từ order items
      const reorderItems = allItems.map((item) => {
        if (item.type === 'COMBO') {
          return {
            type: 'COMBO',
            comboId: item.refId,
            quantity: item.quantity || 1,
          };
        }

        const payload: any = {
          type: 'PRODUCT',
          quantity: item.quantity || 1,
        };

        if (item.variantId) {
          // Sản phẩm có variant → gửi variantId
          payload.variantId = item.variantId;
        } else {
          // Sản phẩm không có variant → gửi productId
          payload.productId = item.refId;
        }
        return payload;
      });

      await CustomerCartService.addToCart(reorderItems as any);

      // Load lại giỏ để lấy cartItemId phục vụ cho checkout
      const cart = await CustomerCartService.getCart();
      const selectedCartItemIds = cart.items.map((ci) => ci.cartItemId);

      const checkoutPayload = {
        selectedCartItemIds,
        storeVouchers: {}, // Không áp dụng voucher khi mua lại
        selectedAddressId: null,
        createdAt: Date.now(),
      };

      try {
        sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(checkoutPayload));
      } catch (e) {
        console.error('❌ [REORDER] Failed to cache checkout payload:', e);
      }

      showCenterSuccess(
        'Đã thêm lại sản phẩm vào giỏ hàng. Đang chuyển tới trang thanh toán...',
        'Mua lại đơn hàng',
      );
      navigate('/checkout');
    } catch (error: any) {
      console.error('❌ [REORDER] Failed to buy again:', error);
      const msg =
        error?.message ||
        error?.data?.message ||
        CustomerCartService.formatCartError(error) ||
        'Không thể mua lại đơn hàng. Vui lòng thử lại.';
      showCenterError(msg, 'Lỗi');
    }
  };

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
        // Reload cancel requests after sending request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
        setShowCancelModal(false);
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
        if (onOrderCancelled) {
          onOrderCancelled();
        }
      } else {
        await OrderHistoryService.cancel(order.id, cancelReason, cancelNote);
        message.success('Hủy đơn hàng thành công');
        setShowCancelModal(false);
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
        if (onOrderCancelled) {
          onOrderCancelled();
        }
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Hủy đơn hàng thất bại');
      // Check if error is about duplicate request (status 400 in response body or HTTP status)
      if (err?.status === 400 || err?.data?.status === 400) {
        // Show warning instead of error for duplicate requests
        message.warning(errorMessage, 5);
        // Reload cancel requests to show existing request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
        // Don't close modal on duplicate request so user can see the message
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReceived = async () => {
    try {
      setIsConfirmingReceived(true);
      await OrderHistoryService.confirmReceived(order.id);
      message.success('Xác nhận đã nhận hàng thành công');
      
      // Reload page to get updated order status
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, 'Không thể xác nhận đã nhận hàng'));
    } finally {
      setIsConfirmingReceived(false);
    }
  };

  const handleCancelShipping = async () => {
    try {
      setIsCancellingShipping(true);
      await OrderHistoryService.requestCancel(order.id, cancelReason, cancelNote);
      message.success('Yêu cầu hủy giao hàng đã được gửi đến cửa hàng.');
      // Reload cancel requests after sending request
      try {
        const requests = await OrderHistoryService.getCancelRequests(order.id);
        setCancelRequests(requests);
      } catch (error) {
        console.error('Failed to reload cancel requests:', error);
      }
      setShowCancelShippingModal(false);
      setCancelReason('CHANGE_OF_MIND');
      setCancelNote('');
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Không thể gửi yêu cầu hủy giao hàng');
      // Check if error is about duplicate request (status 400 in response body or HTTP status)
      if (err?.status === 400 || err?.data?.status === 400) {
        // Show warning instead of error for duplicate requests
        message.warning(errorMessage, 5);
        // Reload cancel requests to show existing request
        try {
          const requests = await OrderHistoryService.getCancelRequests(order.id);
          startTransition(() => {
            setCancelRequests(requests);
            cancelRequestsRef.current = requests;
          });
        } catch (error) {
          console.error('Failed to reload cancel requests:', error);
        }
        // Don't close modal on duplicate request so user can see the message
        setCancelReason('CHANGE_OF_MIND');
        setCancelNote('');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsCancellingShipping(false);
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
        startTransition(() => {
          setReviewedItemIds((prev) => Array.from(new Set([...prev, selectedReviewItem.productRefId])));
        });
      }
      resetReviewForm();
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Không thể gửi đánh giá, vui lòng thử lại');
      showCenterError(errMsg, 'Gửi đánh giá thất bại');

      if (selectedReviewItem?.productRefId && isAlreadyReviewedError(err)) {
        startTransition(() => {
          setReviewedItemIds((prev) =>
            Array.from(new Set([...prev, selectedReviewItem.productRefId])),
          );
        });
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
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{storeOrder.storeName}</span>
                      </div>
                      {/* Thời gian giao hàng dự kiến - chỉ hiển thị khi chưa giao hàng và chưa có GHN code */}
                      {!ghnOrderData[storeOrder.id]?.orderGhn && 
                       storeOrder.status !== 'SHIPPING' && 
                       storeOrder.status !== 'DELIVERY_SUCCESS' && 
                       storeOrder.status !== 'COMPLETED' && (
                        <>
                          {storeLeadtimesLoading.has(storeOrder.id) ? (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                              <span>Đang tính thời gian giao hàng...</span>
                            </div>
                          ) : storeLeadtimes[storeOrder.id] ? (
                            <div className="mt-1 text-xs text-orange-600">
                              ⏱️ Giao hàng dự kiến: {(() => {
                                const baseDate = new Date(storeLeadtimes[storeOrder.id].leadtime_order.to_estimate_date);
                                // Cộng thêm 48 giờ (2 ngày)
                                const estimatedDate = new Date(baseDate.getTime() + 48 * 60 * 60 * 1000);
                                return estimatedDate.toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              })()}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                    <span style={getStatusBadgeStyle(storeOrder.status)} className="text-xs">
                      {getStatusLabel(storeOrder.status)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Array.isArray(storeOrder.items) && storeOrder.items.length > 0 ? (
                      storeOrder.items.map((item) => {
                        const itemImage = resolveOrderItemImage(item);
                        const productId = item.refId;
                        return (
                          <div 
                            key={item.id} 
                            className="flex gap-3 rounded-xl bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
                            onClick={() => {
                              if (productId && item.type === 'PRODUCT') {
                                navigate(`/product/${productId}`);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (productId && item.type === 'PRODUCT') {
                                  navigate(`/product/${productId}`);
                                }
                              }
                            }}
                          >
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

          {/* Cancel Requests Section - Moved to left column below products */}
          {cancelRequests.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-gray-900">Yêu cầu hủy đơn hàng</h4>
                <Tag color="red" className="ml-2">
                  {cancelRequests.length} yêu cầu
                </Tag>
              </div>
              {loadingCancelRequests ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500 mr-2" />
                  <span className="text-sm text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cancelRequests.map((request: any, index: number) => {
                    const statusInfo = translateCancelRequestStatus(request.status);
                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-red-200 bg-white p-3 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">
                              Yêu cầu #{index + 1}
                            </span>
                            <Tag color={statusInfo.color} className="text-xs">
                              {statusInfo.label}
                            </Tag>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-gray-500">Lý do hủy:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {translateCancelReason(request.reason)}
                            </span>
                          </div>
                          {request.note && (
                            <div>
                              <span className="text-gray-500">Ghi chú:</span>
                              <span className="ml-1 text-gray-700 break-words">
                                {request.note}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Yêu cầu lúc:</span>
                            <span className="font-medium text-gray-700 whitespace-nowrap">
                              {new Date(request.requestedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {request.processedAt && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <span>Xử lý lúc:</span>
                              <span className="font-medium text-gray-700 whitespace-nowrap">
                                {new Date(request.processedAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
                      <div 
                        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 cursor-pointer transition-all hover:opacity-80"
                        onClick={() => {
                          if (productId) {
                            navigate(`/product/${productId}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (productId) {
                              navigate(`/product/${productId}`);
                            }
                          }
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-full w-full p-2 text-gray-400" />
                        )}
                      </div>
                      <div 
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          if (productId) {
                            navigate(`/product/${productId}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (productId) {
                              navigate(`/product/${productId}`);
                            }
                          }
                        }}
                      >
                        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                        {formatVariantLabel(item) && (
                          <p className="text-xs text-gray-500">{formatVariantLabel(item)}</p>
                        )}
                        <p className="text-xs text-gray-500">{item.storeName}</p>
                      </div>
                      <Button
                        type="primary"
                        disabled={reviewed || isChecking}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectReviewItem(item);
                        }}
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
                <span>Giá gốc (chưa giảm giá)</span>
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
                  onClick={() => navigate(`/orders/${order.id}`)}
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
                    onClick={handleBuyAgain}
                  >
                    Mua lại đơn hàng
                  </Button>
                  <Button 
                    className="h-10 w-full" 
                    style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                    onClick={() => setShowReturnModal(true)}
                  >
                    Yêu cầu đổi trả
                  </Button>
                </>
              )}
              {order.status === 'DELIVERY_SUCCESS' && (
                <>
                  <Button
                    type="primary"
                    className="h-10 w-full"
                    style={{ backgroundColor: '#27AE60', borderColor: '#27AE60', borderRadius: '10px' }}
                    onClick={handleConfirmReceived}
                    loading={isConfirmingReceived}
                  >
                    Đã nhận hàng
                  </Button>
                  <Button
                    type="primary"
                    className="h-10 w-full"
                    style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00', borderRadius: '10px' }}
                    onClick={handleBuyAgain}
                  >
                    Mua lại đơn hàng
                  </Button>
                  <Button
                    className="h-10 w-full"
                    style={{ borderRadius: '10px', color: '#FF6A00', borderColor: '#FF6A00' }}
                    onClick={() => setShowReturnModal(true)}
                  >
                    Hoàn trả sản phẩm
                  </Button>
                </>
              )}
              {canCancelShipping && (
                <Button 
                  danger 
                  className="h-10 w-full" 
                  style={{ borderRadius: '10px' }} 
                  onClick={() => {
                    message.warning('Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.', 5);
                    setShowCancelShippingModal(true);
                  }}
                >
                  Yêu cầu hủy giao hàng
                </Button>
              )}
              {canCancelOrder(order.status) && !canCancelShipping && (
                <Button 
                  danger 
                  className="h-10 w-full" 
                  style={{ borderRadius: '10px' }} 
                  onClick={() => {
                    message.warning('Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.', 5);
                    setShowCancelModal(true);
                  }}
                >
                  {order.status === 'AWAITING_SHIPMENT' ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng'}
                </Button>
              )}
              {order.status === 'UNPAID' && (
                <Button
                  type="primary"
                  className="h-10 w-full"
                  style={{ backgroundColor: '#2D9CDB', borderColor: '#2D9CDB', borderRadius: '10px' }}
                  onClick={() => navigate(`/orders/${order.id}`)}
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
            
            {/* Cảnh báo về điểm uy tín */}
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">
                ⚠️ Cảnh báo về điểm uy tín
              </p>
              <p className="mt-2 text-sm text-orange-700">
                Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.
              </p>
            </div>

            <p className="mt-4 text-sm text-gray-600">
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
      {/* Cancel Shipping Modal with Reputation Warning */}
      {showCancelShippingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isCancellingShipping && setShowCancelShippingModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">
              Yêu cầu hủy giao hàng
            </h3>
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">
                ⚠️ Cảnh báo về điểm uy tín
              </p>
              <p className="mt-2 text-sm text-orange-700">
                Việc huỷ đơn sẽ ảnh hưởng đến điểm uy tín của bạn. Điểm uy tín về 0 sẽ khoá thao tác mua hàng 30 ngày.
              </p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Bạn có chắc chắn muốn gửi yêu cầu hủy giao hàng này không?
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
                  if (!isCancellingShipping) {
                    setShowCancelShippingModal(false);
                    setCancelReason('CHANGE_OF_MIND');
                    setCancelNote('');
                  }
                }}
                disabled={isCancellingShipping}
              >
                Hủy
              </Button>
              <Button 
                danger 
                className="flex-1" 
                loading={isCancellingShipping} 
                onClick={handleCancelShipping}
              >
                Xác nhận gửi yêu cầu
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

// 🧩 Memoize component để tránh re-render không cần thiết
// Chỉ so sánh các field quan trọng thay vì JSON.stringify (nhanh hơn)
const OrderCard = React.memo(OrderCardComponent, (prevProps, nextProps) => {
  // Chỉ re-render khi có thay đổi thực sự
  if (prevProps.order.id !== nextProps.order.id) return false;
  if (prevProps.order.status !== nextProps.order.status) return false;
  if (prevProps.order.grandTotal !== nextProps.order.grandTotal) return false;
  
  // So sánh ghnOrderData chỉ cho storeOrders của order này
  const prevGhnData = prevProps.ghnOrderData || {};
  const nextGhnData = nextProps.ghnOrderData || {};
  
  if (prevProps.order.storeOrders) {
    for (const storeOrder of prevProps.order.storeOrders) {
      if (storeOrder.id) {
        const prevGhn = prevGhnData[storeOrder.id];
        const nextGhn = nextGhnData[storeOrder.id];
        if (JSON.stringify(prevGhn) !== JSON.stringify(nextGhn)) {
          return false;
        }
      }
    }
  }
  
  return true; // Skip re-render nếu không có thay đổi
});

export default OrderCard;
