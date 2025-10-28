import { useState, useEffect, useCallback } from 'react';
import { GhnService } from '../services/seller/GhnService';
import type { Ward } from '../types/seller';

interface UseWardsReturn {
  wards: Ward[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchWards: (query: string) => Ward[];
  getWardByCode: (code: string) => Ward | undefined;
  clearWards: () => void;
}

export const useWards = (districtId: number | null): UseWardsReturn => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWards = useCallback(async (districtId: number) => {
    try {
      setLoading(true);
      setError(null);
      const activeWards = await GhnService.getActiveWards(districtId);
      setWards(activeWards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách phường/xã';
      setError(errorMessage);
      console.error('Failed to load wards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (districtId) {
      await loadWards(districtId);
    }
  }, [districtId, loadWards]);

  const searchWards = useCallback((query: string): Ward[] => {
    if (!query.trim()) return wards;
    
    const lowercaseQuery = query.toLowerCase();
    return wards.filter(ward => 
      ward.WardName.toLowerCase().includes(lowercaseQuery) ||
      ward.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [wards]);

  const getWardByCode = useCallback((code: string): Ward | undefined => {
    return wards.find(ward => ward.WardCode === code);
  }, [wards]);

  const clearWards = useCallback(() => {
    setWards([]);
    setError(null);
  }, []);

  // Load wards when districtId changes
  useEffect(() => {
    if (districtId) {
      loadWards(districtId);
    } else {
      clearWards();
    }
  }, [districtId, loadWards, clearWards]);

  return {
    wards,
    loading,
    error,
    refetch,
    searchWards,
    getWardByCode,
    clearWards,
  };
};

export default useWards;
