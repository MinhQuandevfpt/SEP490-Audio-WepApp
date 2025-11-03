/**
 * Order Status Utilities
 * Helper functions for order status display and styling
 */

import type { OrderStatus } from '../types/api';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  UNPAID: {
    label: 'Chờ thanh toán',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
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
  PENDING: {
    label: 'Chờ xử lý',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
};

/**
 * Get status badge class names
 */
export const getStatusBadgeClass = (status: OrderStatus): string => {
  const config = ORDER_STATUS_CONFIG[status];
  return `px-3 py-1.5 text-xs font-medium rounded-full border ${config.color} ${config.bgColor}`;
};

/**
 * Get status label
 */
export const getStatusLabel = (status: OrderStatus): string => {
  return ORDER_STATUS_CONFIG[status]?.label || status;
};

/**
 * Check if order can be cancelled
 */
export const canCancelOrder = (status: OrderStatus): boolean => {
  return ['UNPAID', 'PENDING', 'CONFIRMED', 'AWAITING_SHIPMENT'].includes(status);
};

/**
 * Check if order can request return
 */
export const canRequestReturn = (status: OrderStatus): boolean => {
  return status === 'COMPLETED';
};

/**
 * Check if order is active (not cancelled or returned)
 */
export const isActiveOrder = (status: OrderStatus): boolean => {
  return !['CANCELLED', 'RETURNED'].includes(status);
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

