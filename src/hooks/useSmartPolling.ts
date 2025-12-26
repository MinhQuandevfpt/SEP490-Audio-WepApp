import { useEffect, useRef, useState, useCallback } from 'react';
import { startTransition } from 'react';

/**
 * Smart Polling Hook - Best practices cho realtime update
 * 
 * Features:
 * - Chỉ poll khi tab active
 * - Tăng dần interval nếu data ổn định
 * - Stop khi không cần thiết
 * - Sử dụng React 18 startTransition để không block UI
 * - Debounce updates để tránh giật
 */
export const useSmartPolling = <T = any>(
  fetchFn: () => Promise<T>,
  options: {
    /** Interval ban đầu (ms), mặc định 10000ms */
    initialInterval?: number;
    /** Interval tối đa khi data ổn định (ms), mặc định 60000ms */
    maxInterval?: number;
    /** Số lần data không đổi để tăng interval, mặc định 3 */
    stableCountThreshold?: number;
    /** Function kiểm tra xem có nên tiếp tục poll không */
    shouldContinue?: (data: T | null) => boolean;
    /** Function so sánh data để detect changes */
    isDataChanged?: (oldData: T | null, newData: T) => boolean;
    /** Bật/tắt polling, mặc định true */
    enabled?: boolean;
    /** Callback khi data thay đổi */
    onDataChange?: (data: T) => void;
  } = {}
) => {
  const {
    initialInterval = 10000,
    maxInterval = 60000,
    stableCountThreshold = 3,
    shouldContinue = () => true,
    isDataChanged = (old, newData) => old !== newData,
    enabled = true,
    onDataChange,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const stableCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTabVisibleRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  const dataRef = useRef<T | null>(null);

  // Cập nhật refs
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Debounce helper để tránh giật UI
  const debouncedUpdate = useCallback((newData: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setData(newData);
        dataRef.current = newData;
        if (onDataChange) {
          onDataChange(newData);
        }
      });
    }, 100); // Debounce 100ms
  }, [onDataChange]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (!document.hidden && enabled) {
        // Tab active lại → reset interval và fetch ngay
        setCurrentInterval(initialInterval);
        stableCountRef.current = 0;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        executeFetch();
        setupInterval();
      } else if (document.hidden) {
        // Tab inactive → pause polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, initialInterval]);

  // Execute fetch function
  const executeFetch = useCallback(async () => {
    // Chỉ fetch khi tab visible
    if (!isTabVisibleRef.current || !enabled) {
      return;
    }

    // Kiểm tra xem có nên tiếp tục poll không
    if (!shouldContinue(dataRef.current)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    try {
      setIsLoading(true);
      const newData = await fetchFnRef.current();

      // So sánh data để detect changes
      const hasChanged = isDataChanged(dataRef.current, newData);

      if (hasChanged) {
        // Data thay đổi → reset stable count và interval
        stableCountRef.current = 0;
        setCurrentInterval(initialInterval);
        debouncedUpdate(newData);
      } else {
        // Data không đổi → tăng stable count
        stableCountRef.current += 1;

        // Nếu data ổn định nhiều lần → tăng interval
        if (stableCountRef.current >= stableCountThreshold) {
          setCurrentInterval((prev) => {
            const next = Math.min(prev * 1.5, maxInterval);
            return next;
          });
          stableCountRef.current = 0; // Reset sau khi tăng interval
        }

        // Vẫn update data (có thể có nested changes)
        debouncedUpdate(newData);
      }
    } catch (error) {
      // Silently handle errors - không log để tránh spam
      // Component sẽ tự xử lý errors
    } finally {
      setIsLoading(false);
    }
  }, [debouncedUpdate, isDataChanged, shouldContinue, enabled, initialInterval, maxInterval, stableCountThreshold]);

  // Setup interval
  const setupInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || !isTabVisibleRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      executeFetch();
    }, currentInterval);
  }, [enabled, currentInterval, executeFetch]);

  // Initial fetch và setup
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch ngay lập tức
    executeFetch();

    // Setup interval
    setupInterval();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, executeFetch, setupInterval]);

  // Update interval khi currentInterval thay đổi
  useEffect(() => {
    if (enabled && isTabVisibleRef.current && intervalRef.current) {
      setupInterval();
    }
  }, [currentInterval, enabled, setupInterval]);

  return {
    data,
    isLoading,
    currentInterval,
    refetch: executeFetch,
  };
};

export default useSmartPolling;

