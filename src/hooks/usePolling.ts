import { useEffect, useRef, useCallback } from 'react';

export interface UsePollingOptions {
  /**
   * Interval time in milliseconds (default: 10000 = 10 seconds)
   */
  interval?: number;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Silent mode: don't trigger loading state during background refresh (default: true)
   * When true, only the initial fetch will show loading, background polls won't
   */
  silent?: boolean;
  /**
   * Skip initial fetch on mount (default: false)
   * Set to true if another mechanism (e.g., useEffect) handles the initial fetch
   */
  skipInitialFetch?: boolean;
  /**
   * Callback when polling starts
   */
  onStart?: () => void;
  /**
   * Callback when polling stops
   */
  onStop?: () => void;
  /**
   * Callback when polling error occurs
   */
  onError?: (error: Error) => void;
  /**
   * Callback when data is fetched (for silent updates)
   */
  onFetch?: () => void;
}

/**
 * Custom hook for polling (auto-refresh) API calls
 * 
 * @example
 * ```tsx
 * const fetchData = async () => {
 *   await loadAdminList();
 * };
 * 
 * usePolling(fetchData, { interval: 10_000 });
 * ```
 */
export const usePolling = (
  fetchFn: () => Promise<void> | void,
  options: UsePollingOptions = {}
) => {
  const {
    interval = 10_000, // 10 seconds default
    enabled = true,
    silent = true, // Default to silent mode
    skipInitialFetch = false, // Default to false - perform initial fetch
    onStart,
    onStop,
    onError,
    onFetch,
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  const isInitialFetchRef = useRef(true);

  // Update fetchFn ref when it changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Polling function
  const poll = useCallback(async (isSilent: boolean = false) => {
    if (!isMountedRef.current || !enabled) return;

    try {
      await fetchFnRef.current();
      
      // Call onFetch for silent updates
      if (isSilent && onFetch && isMountedRef.current) {
        onFetch();
      }
    } catch (error) {
      if (onError && isMountedRef.current) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      isInitialFetchRef.current = false;
    }
  }, [enabled, onError, onFetch]);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;
    isInitialFetchRef.current = true;

    // Initial fetch (not silent) - skip if skipInitialFetch is true
    if (enabled && !skipInitialFetch) {
      poll(false);
      if (onStart) {
        onStart();
      }
    } else if (enabled && skipInitialFetch && onStart) {
      // Still call onStart even if skipping initial fetch
      onStart();
    }

    // Setup interval if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        // Background polls are silent
        poll(silent);
      }, interval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onStop && enabled) {
        onStop();
      }
    };
  }, [enabled, interval, silent, skipInitialFetch, poll, onStart, onStop]);

  // Manual refresh function (not silent by default)
  const refresh = useCallback((silentRefresh: boolean = false) => {
    if (isMountedRef.current) {
      poll(silentRefresh);
    }
  }, [poll]);

  return {
    refresh,
    isInitialFetch: isInitialFetchRef.current,
  };
};

export default usePolling;

