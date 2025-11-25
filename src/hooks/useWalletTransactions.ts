import { useCallback, useEffect, useState } from 'react';
import type { WalletTransaction } from '../types/api';
import { WalletService } from '../services/customer/WalletService';

export const useWalletTransactions = (customerId: string | null | undefined) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      setTransactions([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await WalletService.getTransactions(customerId, page - 1, pageSize);
      setTransactions(response.content || []);
      setTotal(response.totalElements || 0);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lịch sử ví');
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [customerId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerId, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    transactions,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    loading,
    error,
    reload: load,
  };
};

export default useWalletTransactions;

