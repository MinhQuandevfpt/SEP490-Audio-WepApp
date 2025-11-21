import { useCallback, useEffect, useState } from 'react';
import type { StoreOrder, StoreOrderStatus } from '../types/seller';
import { StoreOrderService } from '../services/seller/OrderService';

export const useStoreOrders = () => {
  const [status, setStatus] = useState<StoreOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Backend uses 0-based indexing
      const backendPage = page - 1;
      
      const keyword = search?.trim();
      const res = await StoreOrderService.getOrders({
        status: status === 'ALL' ? undefined : status,
        search: keyword || undefined,
        orderCodeKeyword: keyword || undefined,
        page: backendPage,
        size: pageSize,
      });
      
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page, pageSize]);

  useEffect(() => { 
    load(); 
  }, [load]);

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const viewDetail = async (orderId: string) => {
    try {
      const detail = await StoreOrderService.getOrderById(orderId);
      setSelectedOrder(detail);
    } catch (error: any) {
      console.error('Error loading order detail:', error);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await StoreOrderService.updateOrderStatus(orderId, newStatus);
      // Reload orders after status update
      await load();
      if (selectedOrder?.id === orderId) {
        // Reload selected order detail
        await viewDetail(orderId);
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Page will be reset to 1 by useEffect
  };

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return {
    // filters
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    // data
    orders,
    total,
    isLoading,
    error,
    // detail
    selectedOrder,
    setSelectedOrder,
    viewDetail,
    updateStatus,
    refresh,
  };
};

export default useStoreOrders;

