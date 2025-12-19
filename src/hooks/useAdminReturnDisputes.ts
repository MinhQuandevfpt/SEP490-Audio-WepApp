import { useState, useEffect, useCallback } from 'react';
import { AdminReturnService, type AdminReturnDisputesParams } from '../services/admin/AdminReturnService';
import type { ReturnRequestResponse } from '../types/api';

export interface UseAdminReturnDisputesResult {
  disputes: ReturnRequestResponse[];
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}

export const useAdminReturnDisputes = (
  initialPage: number = 0,
  initialPageSize: number = 20
): UseAdminReturnDisputesResult => {
  const [disputes, setDisputes] = useState<ReturnRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: AdminReturnDisputesParams = {
        page,
        size: pageSize,
      };

      const response = await AdminReturnService.getDisputes(params);
      
      setDisputes(response.content || []);
      setTotal(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách khiếu nại hoàn trả');
      setDisputes([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const refresh = () => {
    fetchDisputes();
  };

  return {
    disputes,
    isLoading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    refresh,
  };
};

