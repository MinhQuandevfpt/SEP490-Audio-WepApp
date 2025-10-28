import { useState, useEffect, useCallback } from 'react';
import { GhnService } from '../services/seller/GhnService';
import type { Province } from '../types/seller';

interface UseProvincesReturn {
  provinces: Province[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchProvinces: (query: string) => Province[];
  getProvinceById: (id: number) => Province | undefined;
}

export const useProvinces = (): UseProvincesReturn => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProvinces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const activeProvinces = await GhnService.getActiveProvinces();
      setProvinces(activeProvinces);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách tỉnh';
      setError(errorMessage);
      console.error('Failed to load provinces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await loadProvinces();
  }, [loadProvinces]);

  const searchProvinces = useCallback((query: string): Province[] => {
    if (!query.trim()) return provinces;
    
    const lowercaseQuery = query.toLowerCase();
    return provinces.filter(province => 
      province.ProvinceName.toLowerCase().includes(lowercaseQuery) ||
      province.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [provinces]);

  const getProvinceById = useCallback((id: number): Province | undefined => {
    return provinces.find(province => province.ProvinceID === id);
  }, [provinces]);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  return {
    provinces,
    loading,
    error,
    refetch,
    searchProvinces,
    getProvinceById,
  };
};

export default useProvinces;
