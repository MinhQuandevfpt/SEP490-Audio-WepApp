import { useCallback, useEffect, useState, useRef } from 'react';
import { startTransition } from 'react';
import type { StoreOrder, StoreOrderStatus } from '../types/seller';
import { StoreOrderService } from '../services/seller/OrderService';

export const useStoreOrders = () => {
  const [status, setStatus] = useState<StoreOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const ordersRef = useRef<StoreOrder[]>([]);
  const isTabVisibleRef = useRef(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);
  const startPollingRef = useRef<(() => void) | null>(null);

  // Debounce helper để tránh giật UI khi update state
  const debouncedSetOrders = useCallback((newOrders: StoreOrder[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setOrders(newOrders);
        ordersRef.current = newOrders;
      });
    }, 100);
  }, []);

  const load = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      
      // Backend uses 0-based indexing
      const backendPage = page - 1;
      
      const keyword = search?.trim();
      const res = await StoreOrderService.getOrders({
        status: status === 'ALL' ? undefined : status,
        search: keyword || undefined,
        orderCodeKeyword: keyword || undefined,
        fromDate: fromDate,
        toDate: toDate,
        page: backendPage,
        size: pageSize,
      });
      
      // 🧩 Update từng field nhỏ, không replace toàn state (keepPreviousData pattern)
      ordersRef.current = res.data;
      startTransition(() => {
        // Chỉ update nếu data thực sự thay đổi
        debouncedSetOrders(res.data);
        setTotal(prev => prev !== res.total ? res.total : prev);
        setTotalPages(prev => prev !== res.totalPages ? res.totalPages : prev);
      });
      
      // Restart polling với interval mới dựa trên order status
      if (silent && startPollingRef.current) {
        startPollingRef.current();
      }
    } catch (e: any) {
      if (!silent) {
        setError(e?.message || 'Không thể tải danh sách đơn hàng');
        setOrders([]);
        setTotal(0);
        setTotalPages(0);
      }
      // In silent mode, don't update error state to avoid UI flicker
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [status, search, fromDate, toDate, page, pageSize, debouncedSetOrders]);

  // Update load ref
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  // Smart polling function
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!isTabVisibleRef.current) {
      return;
    }

    // Kiểm tra xem có order nào đang active không (chưa completed/cancelled)
    const hasActiveOrders = ordersRef.current.some(
      order => 
        order.status !== 'COMPLETED' && 
        order.status !== 'CANCELLED' &&
        order.status !== 'RETURNED' &&
        order.status !== 'DELIVERY_SUCCESS'
    );

    // Nếu không có order active → tăng interval lên 30s
    // Nếu có order active → giữ interval 10s
    const interval = hasActiveOrders ? 10000 : 30000;

    pollingIntervalRef.current = setInterval(() => {
      if (!isTabVisibleRef.current || !loadRef.current) {
        return;
      }
      loadRef.current(true); // Silent refresh
    }, interval);
  }, []);

  // Update startPolling ref
  useEffect(() => {
    startPollingRef.current = startPolling;
  }, [startPolling]);

  // Tab visibility detection - chỉ poll khi tab active
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (!document.hidden) {
        // Tab active lại → fetch ngay và restart polling
        if (loadRef.current) {
          loadRef.current(true);
        }
        if (startPollingRef.current) {
          startPollingRef.current();
        }
      } else {
        // Tab inactive → pause polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ⚡ Fetch NGAY khi vào page + Start polling ngay
  useEffect(() => {
    let mounted = true;
    
    // Fetch ngay lập tức (không chờ interval)
    const initialLoad = async () => {
      if (loadRef.current) {
        await loadRef.current(false);
      }
      
      // Start polling ngay sau initial fetch (không chờ orders.length > 0)
      if (mounted && startPollingRef.current) {
        startPollingRef.current();
      }
    };
    
    initialLoad();

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // Update ordersRef khi orders thay đổi
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Reset to page 1 when date range changes
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

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
    fromDate,
    setFromDate,
    toDate,
    setToDate,
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

