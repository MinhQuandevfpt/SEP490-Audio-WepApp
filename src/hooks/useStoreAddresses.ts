import { useCallback, useEffect, useState } from 'react';
import { StoreAddressService } from '../services/seller/StoreAddressService';
import type { StoreAddress } from '../types/seller';

export const useStoreAddresses = () => {
  const [addresses, setAddresses] = useState<StoreAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await StoreAddressService.getStoreAddresses();
      if (data) {
        setAddresses(Array.isArray(data) ? data : []);
      } else {
        setAddresses([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách địa chỉ');
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const refresh = useCallback(() => {
    loadAddresses();
  }, [loadAddresses]);

  return {
    addresses,
    isLoading,
    error,
    refresh,
    loadAddresses,
  };
};

export default useStoreAddresses;

