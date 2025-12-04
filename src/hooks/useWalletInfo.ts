import { useCallback, useEffect, useState } from 'react';
import type { WalletInfo } from '../types/api';
import { WalletService } from '../services/customer/WalletService';

export const useWalletInfo = (customerId: string | null | undefined) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      setWalletInfo(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await WalletService.getWalletInfo(customerId);
      setWalletInfo(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin ví');
      setWalletInfo(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    walletInfo,
    loading,
    error,
    reload: load,
  };
};

export default useWalletInfo;

