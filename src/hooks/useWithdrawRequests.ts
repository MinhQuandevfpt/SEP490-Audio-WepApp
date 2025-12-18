import { useCallback, useEffect, useState } from 'react';
import type { WithdrawRequest, WithdrawRequestStatus } from '../types/api';
import { WalletService } from '../services/customer/WalletService';

export const useWithdrawRequests = (
  customerId: string | null | undefined,
  statusFilter?: WithdrawRequestStatus
) => {
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!customerId) {
      setWithdrawRequests([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await WalletService.getWithdrawRequests(customerId, {
        status: statusFilter,
        page: page - 1, // API uses 0-based pagination
        size: pageSize,
      });
      setWithdrawRequests(response.content || []);
      setTotal(response.totalElements || 0);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách yêu cầu rút tiền');
      setWithdrawRequests([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, statusFilter, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    withdrawRequests,
    loading,
    error,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
    reload: load,
  };
};

export default useWithdrawRequests;
