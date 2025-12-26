import { useEffect, useRef } from 'react';

/**
 * Custom hook để tự động gọi một function sau mỗi khoảng thời gian nhất định
 * @param callback Function cần gọi
 * @param interval Khoảng thời gian (ms), mặc định 5000ms (5 giây)
 * @param enabled Bật/tắt auto-refresh, mặc định true
 */
export const useAutoRefresh = (
  callback: () => void | Promise<void>,
  interval: number = 5000,
  enabled: boolean = true
) => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cập nhật callback ref khi callback thay đổi
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      // Nếu disabled, clear interval nếu có
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Gọi callback ngay lập tức lần đầu
    const executeCallback = async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        // Silently handle errors - không log để tránh spam console
        // Component sẽ tự xử lý errors trong callback của chúng
      }
    };

    // Gọi lần đầu
    executeCallback();

    // Setup interval
    intervalRef.current = setInterval(() => {
      executeCallback();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);
};

export default useAutoRefresh;

