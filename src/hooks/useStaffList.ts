import { useState, useEffect, useCallback } from 'react';
import { StaffService } from '../services/seller/StaffService';
import type { StaffInfo, StaffListResponse } from '../types/seller';

interface UseStaffListReturn {
  staffList: StaffInfo[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  size: number;
  refresh: () => Promise<void>;
  loadPage: (page: number, size?: number) => Promise<void>;
}

export const useStaffList = (initialPage: number = 0, initialSize: number = 10): UseStaffListReturn => {
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);

  const loadStaffList = useCallback(async (pageNum: number, pageSize: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response: StaffListResponse = await StaffService.getStaffList(pageNum, pageSize);
      
      if (response.data) {
        setStaffList(response.data.content || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || pageNum);
        setSize(response.data.size || pageSize);
      } else {
        setStaffList([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách nhân viên');
      setStaffList([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadStaffList(page, size);
  }, [loadStaffList, page, size]);

  const loadPage = useCallback(async (pageNum: number, pageSize?: number) => {
    await loadStaffList(pageNum, pageSize || size);
  }, [loadStaffList, size]);

  useEffect(() => {
    loadStaffList(initialPage, initialSize);
  }, []); // Only load once on mount

  return {
    staffList,
    isLoading,
    error,
    total,
    page,
    size,
    refresh,
    loadPage,
  };
};

export default useStaffList;

