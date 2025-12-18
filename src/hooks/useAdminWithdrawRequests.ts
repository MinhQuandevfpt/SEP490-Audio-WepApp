import { useCallback, useEffect, useState } from 'react';
import type { WithdrawRequest, WithdrawRequestStatus } from '../types/api';
import { AdminWalletService } from '../services/admin/AdminWalletService';

export const useAdminWithdrawRequests = (statusFilter?: WithdrawRequestStatus) => {
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminWalletService.getCustomerWithdrawRequests({
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
  }, [statusFilter, page, pageSize]);

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

export default useAdminWithdrawRequests;
