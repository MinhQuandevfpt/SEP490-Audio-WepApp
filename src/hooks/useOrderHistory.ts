import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderDetail, OrderStatus } from '../data/orderHistory';
import { OrderHistoryService } from '../services/customer/OrderHistoryService';

export const useOrderHistory = () => {
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await OrderHistoryService.list({
        status: status === 'ALL' ? undefined as any : status,
        search: search || undefined,
        page,
        pageSize,
      });
      setOrders(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const viewDetail = async (code: string) => {
    const detail = await OrderHistoryService.getByCode(code);
    setSelectedOrder(detail);
  };

  return {
    // filters
    status,
    setStatus,
    search,
    setSearch,
    page,
    setPage,
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


