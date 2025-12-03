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

// Use a string index to allow extended internal statuses beyond public API enum
// Updated with Shopee-style colors
export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
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
    color: 'text-[#2D9CDB]',
    bgColor: 'bg-[#E6F4FF] border-[#2D9CDB]',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'text-[#27AE60]',
    bgColor: 'bg-[#E6F8F0] border-[#27AE60]',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-[#EB5757]',
    bgColor: 'bg-[#FFEBEB] border-[#EB5757]',
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
    color: 'text-[#FFA73A]',
    bgColor: 'bg-[#FFF4EC] border-[#FFA73A]',
  },
  // ==== Extended internal statuses ====
  READY_FOR_PICKUP: {
    label: 'Kho đang chuẩn bị',
    color: 'text-[#FFA73A]',
    bgColor: 'bg-[#FFF4EC] border-[#FFA73A]',
  },
  READY_FOR_DELIVERY: {
    label: 'Chờ giao hàng',
    color: 'text-[#2D9CDB]',
    bgColor: 'bg-[#E6F4FF] border-[#2D9CDB]',
  },
  OUT_FOR_DELIVERY: {
    label: 'Đang giao hàng',
    color: 'text-[#2D9CDB]',
    bgColor: 'bg-[#E6F4FF] border-[#2D9CDB]',
  },
  DELIVERED_WAITING_CONFIRM: {
    label: 'Chờ xác nhận giao hàng',
    color: 'text-[#2D9CDB]',
    bgColor: 'bg-[#E6F4FF] border-[#2D9CDB]',
  },
  DELIVERY_SUCCESS: {
    label: 'Hoàn thành',
    color: 'text-[#27AE60]',
    bgColor: 'bg-[#E6F8F0] border-[#27AE60]',
  },
  DELIVERY_DENIED: {
  label: 'Giao hàng bị từ chối',
    color: 'text-[#EB5757]',
    bgColor: 'bg-[#FFEBEB] border-[#EB5757]',
  },
  DELIVERY_FAIL: {
  label: 'Giao hàng thất bại',
  color: 'text-[#EB5757]',
  bgColor: 'bg-[#FFEBEB] border-[#EB5757]',
  },
  EXCEPTION: {
  label: 'Lỗi xử lý đơn hàng',
  color: 'text-red-600',
  bgColor: 'bg-red-50 border-red-200',
  },
};

/**
 * Get status badge class names
 */
export const getStatusBadgeClass = (status: OrderStatus | string | undefined | null): string => {
  const config = status ? ORDER_STATUS_CONFIG[status as OrderStatus] : undefined;
  const safeColor = config?.color ?? 'text-gray-600';
  const safeBg = config?.bgColor ?? 'bg-gray-50 border-gray-200';
  return `px-3 py-1.5 text-xs font-medium rounded-full border ${safeColor} ${safeBg}`;
};

/**
 * Get status badge style (for inline styles - Shopee style)
 */
export const getStatusBadgeStyle = (status: OrderStatus | string | undefined | null): { backgroundColor: string; color: string; padding: string; borderRadius: string; fontSize: string; fontWeight: number; border: string } => {
  const statusMap: Record<string, { bgColor: string; textColor: string }> = {
    PENDING: { bgColor: '#FFF4EC', textColor: '#FFA73A' },
    READY_FOR_PICKUP: { bgColor: '#FFF4EC', textColor: '#FFA73A' },
    SHIPPING: { bgColor: '#E6F4FF', textColor: '#2D9CDB' },
    OUT_FOR_DELIVERY: { bgColor: '#E6F4FF', textColor: '#2D9CDB' },
    READY_FOR_DELIVERY: { bgColor: '#E6F4FF', textColor: '#2D9CDB' },
    DELIVERED_WAITING_CONFIRM: { bgColor: '#E6F4FF', textColor: '#2D9CDB' },
    COMPLETED: { bgColor: '#E6F8F0', textColor: '#27AE60' },
    DELIVERY_SUCCESS: { bgColor: '#E6F8F0', textColor: '#27AE60' },
    CANCELLED: { bgColor: '#FFEBEB', textColor: '#EB5757' },
    DELIVERY_DENIED: { bgColor: '#FFEBEB', textColor: '#EB5757' },
    DELIVERY_FAIL: { bgColor: '#FFEBEB', textColor: '#EB5757' },
    EXCEPTION: { bgColor: '#FEF3C7', textColor: '#92400E' },
  };
  
  const style = statusMap[status as string] || { bgColor: '#F5F5F5', textColor: '#666666' };
  
  return {
    backgroundColor: style.bgColor,
    color: style.textColor,
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
  };
};

/**
 * Get status label
 */
export const getStatusLabel = (status: OrderStatus | string): string => {
  return ORDER_STATUS_CONFIG[status]?.label || (status as string);
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
 * Format date - Shopee style: "13:20 - 24/11/2025"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
};

