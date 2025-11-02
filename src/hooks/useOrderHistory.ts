import { useCallback, useEffect, useState } from 'react';
import type { CustomerOrder, OrderStatus } from '../types/api';
import { OrderHistoryService } from '../services/customer/OrderHistoryService';

export const useOrderHistory = () => {
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Backend uses 0-based indexing
      const backendPage = page - 1;
      
      const res = await OrderHistoryService.list({
        status: status === 'ALL' ? undefined : status,
        search: search || undefined,
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
      const detail = await OrderHistoryService.getById(orderId);
      setSelectedOrder(detail);
    } catch (error: any) {
      console.error('Error loading order detail:', error);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Page will be reset to 1 by useEffect
  };

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
  };
};

export default useOrderHistory;


