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
    const cached = this.get(cacheKey);
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
    const cached = this.get(cacheKey);
    if (cached) return cached;

    // Import here to avoid circular dependency
    const { ProfileCustomerService } = await import('../customer/Profilecustomer');
    const data = await ProfileCustomerService.getByCustomerId(customerId);
    this.set(cacheKey, data, 3 * 60 * 1000); // 3 minutes
    return data;
  }

  async getAddresses(customerId: string): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.ADDRESSES(customerId);
    const cached = this.get(cacheKey);
    if (cached) return cached;

    const { ProfileCustomerService } = await import('../customer/Profilecustomer');
    const data = await ProfileCustomerService.getAddresses(customerId);
    this.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
    return data;
  }

  async getProvinces(): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.PROVINCES;
    const cached = this.get(cacheKey);
    if (cached) return cached;

    const response = await fetch('https://provinces.open-api.vn/api/p/');
    const data = await response.json();
    this.set(cacheKey, data, 30 * 60 * 1000); // 30 minutes (provinces rarely change)
    return data;
  }

  async getDistricts(provinceCode: number): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.DISTRICTS(provinceCode);
    const cached = this.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    const data = await response.json();
    this.set(cacheKey, data.districts || [], 30 * 60 * 1000); // 30 minutes
    return data.districts || [];
  }

  async getWards(districtCode: number): Promise<any[]> {
    const cacheKey = ProfileCache.KEYS.WARDS(districtCode);
    const cached = this.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await response.json();
    this.set(cacheKey, data.wards || [], 30 * 60 * 1000); // 30 minutes
    return data.wards || [];
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
