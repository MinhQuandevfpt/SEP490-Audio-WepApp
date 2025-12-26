import { useEffect, useRef } from 'react';

/**
 * Custom hook để tự động gọi các API tuần tự sau mỗi khoảng thời gian nhất định
 * Tránh gọi nhiều API cùng lúc để giảm lag UI
 * @param callbacks Mảng các function cần gọi tuần tự
 * @param interval Khoảng thời gian giữa mỗi lần refresh (ms), mặc định 10000ms (10 giây)
 * @param delayBetweenCalls Delay giữa mỗi API call (ms), mặc định 500ms
 * @param enabled Bật/tắt auto-refresh, mặc định true
 */
export const useSequentialRefresh = (
  callbacks: Array<() => void | Promise<void>>,
  interval: number = 10000,
  delayBetweenCalls: number = 500,
  enabled: boolean = true
) => {
  const callbacksRef = useRef(callbacks);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  // Cập nhật callbacks ref khi callbacks thay đổi
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!enabled) {
      // Nếu disabled, clear interval nếu có
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Helper function để delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Gọi các API tuần tự
    const executeSequential = async () => {
      // Tránh chạy nhiều lần cùng lúc
      if (isRunningRef.current) {
        return;
      }

      isRunningRef.current = true;

      try {
        // Gọi từng API một cách tuần tự với delay giữa các calls
        for (let i = 0; i < callbacksRef.current.length; i++) {
          try {
            await callbacksRef.current[i]();
            // Delay giữa các API calls (trừ API cuối cùng)
            if (i < callbacksRef.current.length - 1) {
              await delay(delayBetweenCalls);
            }
          } catch (error) {
            // Silently handle errors - không log để tránh spam console
            // Component sẽ tự xử lý errors trong callback của chúng
          }
        }
      } finally {
        isRunningRef.current = false;
      }
    };

    // Gọi lần đầu
    executeSequential();

    // Setup interval
    intervalRef.current = setInterval(() => {
      executeSequential();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isRunningRef.current = false;
    };
  }, [interval, delayBetweenCalls, enabled]);
};

export default useSequentialRefresh;

