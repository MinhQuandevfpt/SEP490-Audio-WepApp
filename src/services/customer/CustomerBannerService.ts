// Customer Banner Service - Public API (no authentication required)
import type { 
  Banner,
  BannerListResponse,
} from '../../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export class CustomerBannerService {
  /**
   * Get all active banners (public endpoint - no auth required)
   * Returns banners that are active and within their display time range
   */
  static async getActiveBanners(): Promise<Banner[]> {
    try {
      // Using admin endpoint for now - backend should create a public /banners endpoint later
      const response = await fetch(`${API_URL}/admin/banners`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Get active banners error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: BannerListResponse = await response.json();
      
      console.log('🎯 Banner API Response:', data);
      
      // Filter banners that are active and currently valid
      const now = new Date();
      
      console.log('\n🕐 Time Debug Info:');
      console.log('Current time (Local):', now.toString());
      console.log('Current time (ISO):', now.toISOString());
      console.log('Current timestamp:', now.getTime());
      console.log('Total banners from API:', data.data.length);
      
      const activeBanners = data.data.filter(banner => {
        // Parse time - API returns time without timezone (assumes UTC or local)
        // Try to handle both with and without 'Z' suffix
        const startTime = new Date(banner.startTime);
        const endTime = new Date(banner.endTime);
        
        const isActive = banner.active;
        const isAfterStart = now >= startTime;
        const isBeforeEnd = now <= endTime;
        const isValid = isActive && isAfterStart && isBeforeEnd;
        
        console.log(`\n📋 Banner: "${banner.title}" (ID: ${banner.id})`);
        console.log(`  Raw times from API:`);
        console.log(`    - startTime: "${banner.startTime}"`);
        console.log(`    - endTime: "${banner.endTime}"`);
        console.log(`  Parsed times:`);
        console.log(`    - Start: ${startTime.toString()} | ISO: ${startTime.toISOString()}`);
        console.log(`    - End: ${endTime.toString()} | ISO: ${endTime.toISOString()}`);
        console.log(`  Validation:`);
        console.log(`    - Active: ${isActive ? '✅' : '❌'} ${isActive}`);
        console.log(`    - After Start: ${isAfterStart ? '✅' : '❌'} (now >= start)`);
        console.log(`    - Before End: ${isBeforeEnd ? '✅' : '❌'} (now <= end)`);
        console.log(`    - Final Result: ${isValid ? '✅ WILL SHOW' : '❌ WILL HIDE'}`);
        console.log(`  Images count: ${banner.images?.length || 0}`);
        
        return isValid;
      });
      
      console.log(`\n✅ Active banners to display: ${activeBanners.length}`);
      console.log('-----------------------------------\n');

      // Sort images within each banner by sortOrder
      activeBanners.forEach(banner => {
        if (banner.images && banner.images.length > 0) {
          banner.images.sort((a, b) => a.sortOrder - b.sortOrder);
        }
      });

      return activeBanners;
    } catch (error) {
      console.error('Get active banners error:', error);
      // Return empty array instead of throwing to prevent breaking the UI
      return [];
    }
  }

  /**
   * Get banners by type (e.g., 'HOME', 'PROMOTION', etc.)
   */
  static async getBannersByType(bannerType: string): Promise<Banner[]> {
    try {
      const allBanners = await this.getActiveBanners();
      return allBanners.filter(banner => banner.bannerType === bannerType);
    } catch (error) {
      console.error(`Get banners by type ${bannerType} error:`, error);
      return [];
    }
  }
}
