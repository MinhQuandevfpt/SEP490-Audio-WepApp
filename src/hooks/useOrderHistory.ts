import { useCallback, useEffect, useState, useRef } from 'react';
import { startTransition } from 'react';
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
  const [ghnOrderData, setGhnOrderData] = useState<Record<string, any>>({});
  const ghnOrderDataRef = useRef<Record<string, any>>({});
  const ordersRef = useRef<CustomerOrder[]>([]);
  const isTabVisibleRef = useRef(true);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);
  const startPollingRef = useRef<(() => void) | null>(null);

  // Debounce helper để tránh giật UI khi update state - tăng delay để batch nhiều updates hơn
  const debouncedSetOrders = useCallback((newOrders: CustomerOrder[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setOrders(newOrders);
        ordersRef.current = newOrders;
      });
    }, 300); // Tăng từ 100ms lên 300ms để batch nhiều updates hơn
  }, []);

  const load = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      
      // Backend uses 0-based indexing
      const backendPage = page - 1;
      
      const res = await OrderHistoryService.list({
        status: status === 'ALL' ? undefined : status,
        search: search || undefined,
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

      // Load GHN order data for each storeOrder tuần tự để tránh lag UI
      // Note: Many orders may not have GHN orders yet (404/500 is normal)
      const ghnDataTasks: Array<{ storeOrderId: string }> = [];
      res.data.forEach((order) => {
        if (!Array.isArray(order.storeOrders)) {
          return;
        }
        order.storeOrders.forEach((storeOrder) => {
          // Only load if not already loaded (or force reload if silent mode)
          if (!storeOrder.id || storeOrder.id.includes('-store-')) {
            return;
          }
          // In silent mode (auto-refresh), always reload GHN data to get updates
          // Check ref thay vì state để tránh dependency issues
          if (silent || !ghnOrderDataRef.current[storeOrder.id]) {
            ghnDataTasks.push({ storeOrderId: storeOrder.id });
          }
        });
      });

      // Load GHN data tuần tự với delay giữa mỗi call và batch updates để tránh lag UI
      if (ghnDataTasks.length > 0) {
        // Không await - load trong background tuần tự
        (async () => {
          const ghnUpdates: Record<string, any> = {};
          let updateCount = 0;
          const BATCH_SIZE = 3; // Batch 3 updates mỗi lần
          
          for (const task of ghnDataTasks) {
            try {
              const ghnOrder = await OrderHistoryService.getGhnOrderByStoreOrderId(task.storeOrderId);
              // Service returns null if not found (404/500) - this is normal
              if (ghnOrder && ghnOrder.data) {
                ghnUpdates[task.storeOrderId] = ghnOrder.data;
                updateCount++;
                
                // Batch update mỗi BATCH_SIZE items hoặc khi đến item cuối
                if (updateCount >= BATCH_SIZE || ghnDataTasks.indexOf(task) === ghnDataTasks.length - 1) {
                  const updatesToApply = { ...ghnUpdates };
                  // Update ref ngay lập tức
                  Object.assign(ghnOrderDataRef.current, updatesToApply);
                  // Update state với startTransition để không block UI
                  startTransition(() => {
                    setGhnOrderData((prev) => ({
                      ...prev,
                      ...updatesToApply,
                    }));
                  });
                  // Reset batch
                  Object.keys(ghnUpdates).forEach(key => delete ghnUpdates[key]);
                  updateCount = 0;
                }
              }
              // Delay 400ms giữa mỗi API call để tránh lag UI (tăng từ 300ms)
              if (ghnDataTasks.indexOf(task) < ghnDataTasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            } catch (err: any) {
              // Only log unexpected errors (network issues, etc.)
              // 404/500 errors are handled by service and return null
              if (err?.status !== 404 && err?.status !== 500) {
                console.error(`Unexpected error loading GHN order for ${task.storeOrderId}:`, err);
              }
              // Silently fail - don't block UI
              // Delay ngay cả khi có lỗi để tránh spam requests
              if (ghnDataTasks.indexOf(task) < ghnDataTasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            }
          }
        })().catch(() => {
          // Silently fail - individual errors are already handled
        });
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
  }, [status, search, page, pageSize, debouncedSetOrders]);

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

    // Kiểm tra xem có order nào đang active không (chưa completed)
    const hasActiveOrders = ordersRef.current.some(
      order => 
        order.status !== 'COMPLETED' && 
        order.status !== 'CANCELLED' &&
        order.status !== 'RETURNED'
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
    // expose reload for external refresh
    reload: load,
    // GHN order data
    ghnOrderData,
  };
};

export default useOrderHistory;


