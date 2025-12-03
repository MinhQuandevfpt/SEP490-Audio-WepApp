/**
 * Store Order Status Utilities
 * Helper functions for store order status display and styling
 */

import type { StoreOrderStatus } from '../types/seller';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const STORE_ORDER_STATUS_CONFIG: Record<StoreOrderStatus, StatusConfig> = {
  UNPAID: {
    label: 'Chờ thanh toán',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  PENDING: {
    label: 'Chờ xử lý',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  AWAITING_SHIPMENT: {
    label: 'Chờ lấy hàng',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  READY_FOR_PICKUP: {
    label: 'Kho đang chuẩn bị',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  READY_FOR_DELIVERY: {
    label: 'Chờ giao hàng',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
  },
  OUT_FOR_DELIVERY: {
    label: 'Đang giao hàng',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  DELIVERED_WAITING_CONFIRM: {
    label: 'Chờ xác nhận giao hàng',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
  },
  DELIVERY_SUCCESS: {
    label: 'Giao hàng thành công',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  DELIVERY_DENIED: {
    label: 'Giao hàng thất bại',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  DELIVERY_FAIL: {
    label: 'Giao hàng thất bại',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  EXCEPTION: {
    label: 'Lỗi xử lý đơn hàng',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
  },
  COMPLETED: {
    label: 'Đã giao hàng',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  RETURN_REQUESTED: {
    label: 'Yêu cầu trả hàng',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  RETURNED: {
    label: 'Đã trả hàng',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
};

/**
 * Get status badge class names
 */
export const getStatusBadgeClass = (status: StoreOrderStatus | string | undefined | null): string => {
  const config = status ? STORE_ORDER_STATUS_CONFIG[status as StoreOrderStatus] : undefined;
  const safeColor = config?.color ?? 'text-gray-600';
  const safeBg = config?.bgColor ?? 'bg-gray-50 border-gray-200';
  return `px-3 py-1.5 text-xs font-medium rounded-full border ${safeColor} ${safeBg}`;
};

/**
 * Get status label
 */
export const getStatusLabel = (status: StoreOrderStatus | string | undefined | null): string => {
  if (!status) return 'Không xác định';
  return STORE_ORDER_STATUS_CONFIG[status as StoreOrderStatus]?.label || status;
};

/**
 * Check if order can be confirmed
 */
export const canConfirmOrder = (status: StoreOrderStatus): boolean => {
  return status === 'PENDING';
};

/**
 * Check if order can be cancelled
 */
export const canCancelOrder = (status: StoreOrderStatus): boolean => {
  return ['PENDING', 'CONFIRMED', 'AWAITING_SHIPMENT'].includes(status);
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

