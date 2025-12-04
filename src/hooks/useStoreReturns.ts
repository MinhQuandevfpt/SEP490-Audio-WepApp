import { useCallback, useEffect, useState } from 'react';
import type { ReturnRequestResponse } from '../types/api';
import { StoreReturnService } from '../services/seller/StoreReturnService';

const useStoreReturns = () => {
  const [returns, setReturns] = useState<ReturnRequestResponse[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const backendPage = page - 1;
      const res = await StoreReturnService.list({
        page: backendPage,
        size: pageSize,
      });

      setReturns(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách yêu cầu hoàn trả');
      setReturns([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePageChange = (newPage: number, newSize?: number) => {
    setPage(newPage);
    if (newSize && newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  return {
    returns,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    error,
    setPage,
    setPageSize,
    onPaginationChange: handlePageChange,
    reload: load,
  };
};

export default useStoreReturns;


