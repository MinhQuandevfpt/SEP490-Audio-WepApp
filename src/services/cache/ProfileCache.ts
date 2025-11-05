// Profile Data Cache Service
// Tối ưu hiệu năng bằng cách cache dữ liệu profile

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ProfileCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Specific cache keys
  static KEYS = {
    USER_PROFILE: (customerId: string) => `user_profile_${customerId}`,
    ADDRESSES: (customerId: string) => `addresses_${customerId}`,
    PROVINCES: 'provinces_list',
    DISTRICTS: (provinceCode: number) => `districts_${provinceCode}`,
    WARDS: (districtCode: number) => `wards_${districtCode}`,
  };

  // Preload data for better performance
  async preloadUserData(customerId: string): Promise<{
    userProfile?: any;
    addresses?: any[];
    provinces?: any[];
  }> {
    const cacheKey = `preload_${customerId}`;
    const cached = this.get<{ userProfile?: any; addresses?: any[]; provinces?: any[] }>(cacheKey);
    if (cached) return cached;

    try {
      const [userProfile, addresses, provinces] = await Promise.allSettled([
        this.getUserProfile(customerId),
        this.getAddresses(customerId),
        this.getProvinces()
      ]);

      const result = {
        userProfile: userProfile.status === 'fulfilled' ? userProfile.value : null,
        addresses: addresses.status === 'fulfilled' ? addresses.value : [],
        provinces: provinces.status === 'fulfilled' ? provinces.value : []
      };

      // Cache the preloaded data for 2 minutes
      this.set(cacheKey, result, 2 * 60 * 1000);
      return result;
    } catch (error) {
      console.error('Preload error:', error);
      return {};
    }
  }

  // Individual data getters with caching
  async getUserProfile(customerId: string): Promise<any> {
    const cacheKey = ProfileCache.KEYS.USER_PROFILE(customerId);
    const cached = this.get<any>(cacheKey);
    if (cached) return cached;

    // Import here to avoid circular dependency
    const { default: ProfileCustomerService } = await import('../customer/Profilecustomer');
    const data = await ProfileCustomerService.getByCustomerId(customerId);
    this.set(cacheKey, data, 3 * 60 * 1000); // 3 minutes
    return data;
  }

  async getAddresses(customerId: string): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.ADDRESSES(customerId);
    const cached = this.get<any[]>(cacheKey);
    if (cached) return cached;

    const { default: ProfileCustomerService } = await import('../customer/Profilecustomer');
    const data = await ProfileCustomerService.getAddresses(customerId);
    this.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
    return data;
  }

  async getProvinces(): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.PROVINCES;
    const cached = this.get<any[]>(cacheKey);
    if (cached) return cached;
    try {
      // Try HTTPS first
      let response = await fetch('https://provinces.open-api.vn/api/p/');
      if (!response.ok) throw new Error(`Provinces HTTP ${response.status}`);
      const data = await response.json();
      this.set(cacheKey, data, 30 * 60 * 1000); // 30 minutes (provinces rarely change)
      return data;
    } catch (err) {
      console.warn('Provinces API HTTPS failed, retrying via HTTP:', err);
      try {
        // Fallback to HTTP (some environments have SSL date issues)
        const response2 = await fetch('http://provinces.open-api.vn/api/p/');
        if (!response2.ok) throw new Error(`Provinces HTTP ${response2.status}`);
        const data2 = await response2.json();
        this.set(cacheKey, data2, 30 * 60 * 1000);
        return data2;
      } catch (err2) {
        console.error('Failed to fetch provinces list:', err2);
        return [];
      }
    }
  }

  async getDistricts(provinceCode: number): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.DISTRICTS(provinceCode);
    const cached = this.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      let response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      if (!response.ok) throw new Error(`Districts HTTP ${response.status}`);
      const data = await response.json();
      const districts = data.districts || [];
      this.set(cacheKey, districts, 30 * 60 * 1000); // 30 minutes
      return districts;
    } catch (err) {
      console.warn('Districts API HTTPS failed, retrying via HTTP:', err);
      try {
        const response2 = await fetch(`http://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        if (!response2.ok) throw new Error(`Districts HTTP ${response2.status}`);
        const data2 = await response2.json();
        const districts2 = data2.districts || [];
        this.set(cacheKey, districts2, 30 * 60 * 1000);
        return districts2;
      } catch (err2) {
        console.error('Failed to fetch districts:', err2);
        return [];
      }
    }
  }

  async getWards(districtCode: number): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.WARDS(districtCode);
    const cached = this.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      let response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      if (!response.ok) throw new Error(`Wards HTTP ${response.status}`);
      const data = await response.json();
      const wards = data.wards || [];
      this.set(cacheKey, wards, 30 * 60 * 1000); // 30 minutes
      return wards;
    } catch (err) {
      console.warn('Wards API HTTPS failed, retrying via HTTP:', err);
      try {
        const response2 = await fetch(`http://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        if (!response2.ok) throw new Error(`Wards HTTP ${response2.status}`);
        const data2 = await response2.json();
        const wards2 = data2.wards || [];
        this.set(cacheKey, wards2, 30 * 60 * 1000);
        return wards2;
      } catch (err2) {
        console.error('Failed to fetch wards:', err2);
        return [];
      }
    }
  }

  // Invalidate cache when data is updated
  invalidateUserData(customerId: string): void {
    this.delete(ProfileCache.KEYS.USER_PROFILE(customerId));
    this.delete(ProfileCache.KEYS.ADDRESSES(customerId));
    this.delete(`preload_${customerId}`);
  }
}

// Export singleton instance
export const profileCache = new ProfileCache();
export default profileCache;
