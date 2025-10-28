import { useState, useEffect, useCallback } from 'react';
import { GhnService } from '../services/seller/GhnService';
import type { District } from '../types/seller';

interface UseDistrictsReturn {
  districts: District[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchDistricts: (query: string) => District[];
  getDistrictById: (id: number) => District | undefined;
  clearDistricts: () => void;
}

export const useDistricts = (provinceId: number | null): UseDistrictsReturn => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDistricts = useCallback(async (provinceId: number) => {
    try {
      setLoading(true);
      setError(null);
      const activeDistricts = await GhnService.getActiveDistricts(provinceId);
      setDistricts(activeDistricts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách quận/huyện';
      setError(errorMessage);
      console.error('Failed to load districts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (provinceId) {
      await loadDistricts(provinceId);
    }
  }, [provinceId, loadDistricts]);

  const searchDistricts = useCallback((query: string): District[] => {
    if (!query.trim()) return districts;
    
    const lowercaseQuery = query.toLowerCase();
    return districts.filter(district => 
      district.DistrictName.toLowerCase().includes(lowercaseQuery) ||
      district.NameExtension.some(ext => 
        ext.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [districts]);

  const getDistrictById = useCallback((id: number): District | undefined => {
    return districts.find(district => district.DistrictID === id);
  }, [districts]);

  const clearDistricts = useCallback(() => {
    setDistricts([]);
    setError(null);
  }, []);

  // Load districts when provinceId changes
  useEffect(() => {
    if (provinceId) {
      loadDistricts(provinceId);
    } else {
      clearDistricts();
    }
  }, [provinceId, loadDistricts, clearDistricts]);

  return {
    districts,
    loading,
    error,
    refetch,
    searchDistricts,
    getDistrictById,
    clearDistricts,
  };
};

export default useDistricts;
