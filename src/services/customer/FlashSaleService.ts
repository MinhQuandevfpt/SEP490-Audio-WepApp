import { HttpInterceptor } from '../HttpInterceptor';
import { ProductListService } from './ProductListService';
import type {
  FlashSaleCampaign,
  FlashSaleListResponse,
  FlashSaleProductsResponse,
  FlashSaleProduct,
  FlashSaleSlot,
  TimeFilter,
  CurrentFlashSaleSlot
} from '../../types/flashsale';


export class FlashSaleService {
  /**
   * 1. Lấy danh sách tất cả Flash Sale campaigns
   * GET /api/campaigns/fast-sale
   * 
   * @param filters 
   */
  static async getAllFlashSales(filters?: {
    status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'APPROVE';
    start?: string; 
    end?: string; 
  }): Promise<FlashSaleCampaign[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start) params.append('start', filters.start);
      if (filters?.end) params.append('end', filters.end);

      const queryString = params.toString();
      const endpoint = `/api/campaigns/fast-sale${queryString ? `?${queryString}` : ''}`;

      const response = await HttpInterceptor.fetch<FlashSaleListResponse>(endpoint, {
        userType: 'customer'
      });

      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Không thể tải danh sách Flash Sale');
    }
  }

  /**
   * 2. Lấy sản phẩm của một slot cụ thể
   * GET /api/campaigns/{campaignId}/slots/{slotId}/products
   * 
   * @param campaignId 
   * @param slotId 
   * @param timeFilter 
   */
  static async getSlotProducts(
    campaignId: string,
    slotId: string,
    timeFilter?: TimeFilter
  ): Promise<FlashSaleProduct[]> {
    try {
      const params = new URLSearchParams();
      if (timeFilter) params.append('timeFilter', timeFilter);

      const queryString = params.toString();
      const endpoint = `/api/campaigns/${campaignId}/slots/${slotId}/products${
        queryString ? `?${queryString}` : ''
      }`;

      const response = await HttpInterceptor.fetch<FlashSaleProductsResponse>(endpoint, {
        userType: 'customer'
      });

      return response.data?.items || [];
    } catch (error: any) {
      throw new Error(error.message || 'Không thể tải sản phẩm của khung giờ');
    }
  }

  static findCurrentActiveSlot(campaigns: FlashSaleCampaign[]): {
    campaign: FlashSaleCampaign;
    slot: FlashSaleSlot;
  } | null {
    const now = new Date();

    for (const campaign of campaigns) {
      
      if (campaign.status !== 'ACTIVE') continue;

      for (const slot of campaign.slots) {
        const openTime = new Date(slot.openTime);
        const closeTime = new Date(slot.closeTime);

       
        if (openTime <= now && now <= closeTime && slot.status === 'ACTIVE') {
          return { campaign, slot };
        }
      }
    }

    return null;
  }

 
  static async getCurrentFlashSale(): Promise<CurrentFlashSaleSlot | null> {
    try {
      
      const campaigns = await this.getAllFlashSales({ status: 'ACTIVE' });

      if (!campaigns || campaigns.length === 0) {
        return null;
      }
      const currentSlot = this.findCurrentActiveSlot(campaigns);

      if (!currentSlot) {
        return null;
      }
      let products = await this.getSlotProducts(
        currentSlot.campaign.id,
        currentSlot.slot.id,
        'ONGOING'
      );

     
      if (products.length === 0) {
        const allProducts = await this.getSlotProducts(
          currentSlot.campaign.id,
          currentSlot.slot.id
        );
        
        if (allProducts.length > 0) {
          // Lọc sản phẩm đang trong thời gian slot
          const slotOpen = new Date(currentSlot.slot.openTime);
          const slotClose = new Date(currentSlot.slot.closeTime);
          
          products = allProducts.filter(product => {
            const productStart = new Date(product.startTime);
            const productEnd = new Date(product.endTime);
            // Sản phẩm phải overlap với slot time
            const overlaps = productStart <= slotClose && productEnd >= slotOpen;
            return overlaps;
          });
        }
      }

      
      products = products.filter(product => 
        product.status === 'APPROVE' || product.status === 'ACTIVE'
      );

     
      products = await this.enrichProductsWithImages(products);

      return {
        campaign: currentSlot.campaign,
        slot: currentSlot.slot,
        products: products.slice(0, 15)
      };
    } catch (error: any) {
      return null;
    }
  }

 
  static async enrichProductsWithImages(
    products: FlashSaleProduct[]
  ): Promise<FlashSaleProduct[]> {
    try {
      const enrichedProducts = await Promise.all(
        products.map(async (product) => {
          try {
           
            const response = await ProductListService.getProductById(product.productId);
            
           
            const productData = response.data;

        
            const firstImage = productData.images && productData.images.length > 0 
              ? productData.images[0] 
              : null;

            
            const variants = productData.variants || [];
            const hasVariants = variants.length > 0;

            let originalPrice = product.originalPrice;
            let discountedPrice = product.discountedPrice;

            if (hasVariants) {
            
              const variantPrices = variants
                .map(v => v.variantPrice || 0)
                .filter(p => p > 0);
              
              if (variantPrices.length > 0) {
                const minVariantPrice = Math.min(...variantPrices);
                
               
                originalPrice = minVariantPrice;
                
                
                if (product.type === 'PERCENT' && product.discountPercent) {
                  const discount = (minVariantPrice * product.discountPercent) / 100;
                  const maxDiscount = product.maxDiscountValue || discount;
                  discountedPrice = minVariantPrice - Math.min(discount, maxDiscount);
                } else if (product.type === 'FIXED' && product.discountValue) {
                  discountedPrice = Math.max(0, minVariantPrice - product.discountValue);
                } else {
                
                  discountedPrice = minVariantPrice;
                }
              }
            } else {
              
              if (!originalPrice || originalPrice === 0) {
                originalPrice = productData.finalPrice || productData.price || 0;
              }
              
            
              if (!discountedPrice || discountedPrice === 0) {
                if (product.type === 'PERCENT' && product.discountPercent) {
                  const discount = (originalPrice * product.discountPercent) / 100;
                  const maxDiscount = product.maxDiscountValue || discount;
                  discountedPrice = Math.max(0, originalPrice - Math.min(discount, maxDiscount));
                } else if (product.type === 'FIXED' && product.discountValue) {
                  discountedPrice = Math.max(0, originalPrice - product.discountValue);
                } else {
                  discountedPrice = originalPrice;
                }
              }
            }

            return {
              ...product,
              imageUrl: firstImage || product.imageUrl || '',
              originalPrice,
              discountedPrice
            };
          } catch (error) {
            return {
              ...product,
              imageUrl: product.imageUrl || ''
            };
          }
        })
      );

      return enrichedProducts;
    } catch (error) {
      return products;
    }
  }

  /**
   
   * @param closeTime 
   * @returns { hours, minutes, seconds } 
   */
  static calculateTimeRemaining(closeTime: string): {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } | null {
    const now = new Date();
    const end = new Date(closeTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return null;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds };
  }


  static formatTimeRemaining(closeTime: string): string {
    const remaining = this.calculateTimeRemaining(closeTime);

    if (!remaining) {
      return '00:00:00';
    }

    const h = String(remaining.hours).padStart(2, '0');
    const m = String(remaining.minutes).padStart(2, '0');
    const s = String(remaining.seconds).padStart(2, '0');

    return `${h}:${m}:${s}`;
  }


  static async getCampaignSlots(campaignId: string): Promise<FlashSaleSlot[]> {
    try {
      
      const campaigns = await this.getAllFlashSales();
      const campaign = campaigns.find(c => c.id === campaignId);

      if (!campaign) {
        throw new Error('Không tìm thấy chiến dịch Flash Sale');
      }

    
      return campaign.slots.sort((a, b) => {
        return new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
      });
    } catch (error: any) {
      throw new Error(error.message || 'Không thể tải khung giờ Flash Sale');
    }
  }


  static formatSlotTime(timeString: string): string {
    const date = new Date(timeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

 
  static isSlotActive(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);
    const closeTime = new Date(slot.closeTime);

    return openTime <= now && now <= closeTime && slot.status === 'ACTIVE';
  }

 
  static isSlotUpcoming(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);

    return now < openTime && slot.status !== 'EXPIRED' && slot.status !== 'CLOSED';
  }

 
  static getSlotStatusLabel(slot: FlashSaleSlot): string {
    if (this.isSlotActive(slot)) return 'Đang diễn ra';
    if (this.isSlotUpcoming(slot)) return 'Sắp diễn ra';
    if (slot.status === 'CLOSED' || slot.status === 'EXPIRED') return 'Đã kết thúc';
    return 'Không xác định';
  }


  static isSlotTomorrow(slot: FlashSaleSlot): boolean {
    const now = new Date();
    const openTime = new Date(slot.openTime);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return openTime >= tomorrow && openTime < dayAfterTomorrow;
  }


  static findNextUpcomingSlot(campaigns: FlashSaleCampaign[]): {
    campaign: FlashSaleCampaign;
    slot: FlashSaleSlot;
    openTime: Date;
  } | null {
    const now = new Date();
    let nextSlot: {
      campaign: FlashSaleCampaign;
      slot: FlashSaleSlot;
      openTime: Date;
    } | null = null;
    let minTimeDiff = Infinity;

    for (const campaign of campaigns) {
      if (campaign.status !== 'ACTIVE') continue;

      for (const slot of campaign.slots) {
        const openTime = new Date(slot.openTime);
        
       
        if (openTime > now && slot.status !== 'EXPIRED' && slot.status !== 'CLOSED') {
          const timeDiff = openTime.getTime() - now.getTime();
          
         
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            nextSlot = { campaign, slot, openTime };
          }
        }
      }
    }

    return nextSlot;
  }
}
