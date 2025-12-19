import type { Product } from '../services/customer/ProductListService';

/**
 * Calculate discount from platform vouchers (Flash Sale, Mega Sale, etc.)
 * Logic tương tự ProductSuggestions.mapToProduct để đảm bảo tính nhất quán
 */
export const calculateProductDiscount = (product: Product): {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
} => {
  let originalPrice: number = 0;
  let finalPrice: number = 0;
  let discountPercent = 0;

  // Xử lý giá: Ưu tiên từ variants nếu có, sau đó mới dùng price từ root
  if (product.variants && product.variants.length > 0) {
    // Nếu có variants, lấy giá từ variants
    const variantPrices = product.variants
      .map(v => v.price ?? v.variantPrice ?? 0)
      .filter(p => p > 0);
    if (variantPrices.length > 0) {
      const minVariantPrice = Math.min(...variantPrices);
      
      // Dùng giá thấp nhất từ variants để hiển thị
      originalPrice = minVariantPrice;
      
      // Xử lý finalPrice từ API:
      // 1. Nếu API đã tính finalPrice ở root level và khác originalPrice, dùng nó (đã có discount)
      // 2. Nếu không, tạm thời set = originalPrice để tính từ campaign sau
      if (product.finalPrice !== null && product.finalPrice !== undefined && product.finalPrice !== minVariantPrice) {
        // Backend đã tính sẵn finalPrice và có discount (khác giá gốc)
        finalPrice = product.finalPrice;
      } else {
        // Chưa có finalPrice hoặc finalPrice = giá gốc, tạm thời set = originalPrice
        // Sẽ tính lại từ campaign nếu có
        finalPrice = minVariantPrice;
      }
    } else {
      // Variants không có giá hợp lệ, fallback về price từ root
      originalPrice = product.price ?? 0;
      finalPrice = product.finalPrice ?? product.price ?? 0;
    }
  } else {
    // Không có variants, dùng giá từ root level
    originalPrice = product.price ?? 0;
    // Nếu finalPrice đã được tính và khác originalPrice, dùng nó (đã có discount)
    // Nếu không, set = originalPrice để tính từ campaign sau
    if (product.finalPrice !== null && product.finalPrice !== undefined && product.finalPrice !== originalPrice) {
      finalPrice = product.finalPrice;
    } else {
      finalPrice = originalPrice;
    }
  }

  // Nếu discountPrice và finalPrice đều null/0 hoặc finalPrice = originalPrice (chưa có discount),
  // và sản phẩm có campaign, tính giá sau giảm từ campaign
  const hasCampaign = product.vouchers?.platformVouchers && product.vouchers.platformVouchers.length > 0;
  const needsCampaignCalculation = 
    (product.discountPrice === null || product.discountPrice === undefined) &&
    (product.finalPrice === null || product.finalPrice === undefined || finalPrice === originalPrice) &&
    originalPrice > 0 &&
    hasCampaign;

  if (needsCampaignCalculation && hasCampaign && product.vouchers?.platformVouchers) {
    // Lấy campaign đầu tiên
    const campaign = product.vouchers.platformVouchers[0];
    
    // Lấy voucher active từ campaign
    if (campaign.vouchers && campaign.vouchers.length > 0) {
      const voucher = campaign.vouchers[0];
      const now = new Date();
      
      // Kiểm tra voucher có active không
      let isActive = false;
      
      // Kiểm tra thời gian voucher (có thể có slot time cho Flash Sale)
      const voucherAny = voucher as any;
      if (voucherAny.slotOpenTime && voucherAny.slotCloseTime) {
        // Flash Sale: check slot time và slot status
        const slotOpen = new Date(voucherAny.slotOpenTime);
        const slotClose = new Date(voucherAny.slotCloseTime);
        isActive =
          now >= slotOpen &&
          now <= slotClose &&
          voucherAny.slotStatus === 'ACTIVE';
      } else if (voucher.startTime && voucher.endTime) {
        // Regular campaign: check voucher time
        const startTime = new Date(voucher.startTime);
        const endTime = new Date(voucher.endTime);
        isActive =
          now >= startTime &&
          now <= endTime &&
          voucher.status === 'ACTIVE';
      } else {
        // Nếu không có thời gian, chỉ check status
        isActive = voucher.status === 'ACTIVE';
      }
      
      if (isActive) {
        // Tính giá sau giảm dựa trên type của voucher
        if (voucher.type === 'PERCENT' && voucher.discountPercent) {
          // PERCENT: price - (price * discountPercent / 100)
          const discountAmount = (originalPrice * voucher.discountPercent) / 100;
          // Áp dụng maxDiscountValue nếu có
          const finalDiscount = voucher.maxDiscountValue
            ? Math.min(discountAmount, voucher.maxDiscountValue)
            : discountAmount;
          finalPrice = Math.max(0, originalPrice - finalDiscount);
          discountPercent = voucher.discountPercent;
        } else if (voucher.type === 'FIXED' && voucher.discountValue) {
          // FIXED: price - discountValue
          finalPrice = Math.max(0, originalPrice - voucher.discountValue);
          // Tính discountPercent từ discountValue
          if (originalPrice > 0) {
            discountPercent = Math.round(((voucher.discountValue / originalPrice) * 100));
          }
        }
      }
    }
  }

  // Fallback: Nếu finalPrice vẫn là 0 (chưa được set), dùng originalPrice
  if (finalPrice === 0 && originalPrice > 0) {
    finalPrice = originalPrice;
  }

  // Tính discount percent từ finalPrice và originalPrice (nếu chưa tính)
  if (discountPercent === 0 && originalPrice > 0 && finalPrice > 0 && finalPrice < originalPrice) {
    discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  }

  const hasDiscount = discountPercent > 0 && finalPrice < originalPrice;

  return {
    originalPrice,
    finalPrice: hasDiscount ? finalPrice : originalPrice,
    discountPercent,
    hasDiscount,
  };
};

/**
 * Apply discount calculation to a product and return updated product
 */
export const applyDiscountToProduct = (product: Product): Product => {
  const { originalPrice, finalPrice, discountPercent, hasDiscount } = calculateProductDiscount(product);

  return {
    ...product,
    price: originalPrice,
    finalPrice: finalPrice,
    discountPrice: hasDiscount ? finalPrice : null,
    promotionPercent: hasDiscount ? discountPercent : null,
    priceAfterPromotion: finalPrice,
    priceBeforeVoucher: originalPrice,
  };
};

