import { useState, useEffect, useCallback } from 'react';
import { profileCache } from '../services/cache/ProfileCache';
import { loadProfileData, type ProfileData } from '../data/profiledata';

interface UseProfileDataReturn {
  data: ProfileData | null;
  preloadedData: {
    userProfile?: any;
    addresses?: any[];
    provinces?: any[];
  };
  loading: boolean;
  refreshData: () => Promise<void>;
  invalidateCache: () => void;
}

export const useProfileData = (): UseProfileDataReturn => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [preloadedData, setPreloadedData] = useState<{
    userProfile?: any;
    addresses?: any[];
    provinces?: any[];
  }>({});
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Load local data immediately
      const localData = loadProfileData();
      setData(localData);

      // Get customer ID
      const customerId = localStorage.getItem('customer_id');
      if (customerId) {
        // Preload API data in background
        const apiData = await profileCache.preloadUserData(customerId);
        setPreloadedData(apiData);
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidateCache = useCallback(() => {
    const customerId = localStorage.getItem('customer_id');
    if (customerId) {
      profileCache.invalidateUserData(customerId);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data,
    preloadedData,
    loading,
    refreshData,
    invalidateCache
  };
};
