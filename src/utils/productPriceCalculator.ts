import type { Product } from '../services/customer/ProductListService';

/**
 * Calculate discount from platform vouchers (Flash Sale, Mega Sale, etc.)
 * Similar logic to ProductSuggestions.mapToProduct
 */
export const calculateProductDiscount = (product: Product): {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
} => {
  let discountPercent = 0;
  let discountedPrice = product.price ?? 0;
  let originalPrice = product.price ?? 0;

  // Check if product has variants and calculate min price
  if (product.variants && product.variants.length > 0) {
    // Get minimum price from variants
    const variantPrices = product.variants.map(v => v.price ?? v.variantPrice ?? 0).filter(p => p > 0);
    if (variantPrices.length > 0) {
      const minVariantPrice = Math.min(...variantPrices);
      originalPrice = minVariantPrice;
      discountedPrice = minVariantPrice;
    }
  }

  // Check platform vouchers ONLY (Flash Sale, etc.)
  if (product.vouchers?.platformVouchers && product.vouchers.platformVouchers.length > 0) {
    const campaign = product.vouchers.platformVouchers[0];
    if (campaign.vouchers && campaign.vouchers.length > 0) {
      const voucher = campaign.vouchers[0];

      // Check if voucher is active (within time range)
      const now = new Date();
      let isActive = false;

      // Check for Flash Sale slot times (if available)
      const voucherAny = voucher as any;
      if (voucherAny.slotOpenTime && voucherAny.slotCloseTime) {
        // Flash Sale: check slot time and slot status
        isActive =
          now >= new Date(voucherAny.slotOpenTime) &&
          now <= new Date(voucherAny.slotCloseTime) &&
          voucherAny.slotStatus === 'ACTIVE';
      } else {
        // Regular campaign: check voucher time
        isActive =
          now >= new Date(voucher.startTime) &&
          now <= new Date(voucher.endTime) &&
          voucher.status === 'ACTIVE';
      }

      if (isActive && voucher.type === 'PERCENT' && voucher.discountPercent) {
        discountPercent = voucher.discountPercent;
        const discount = (originalPrice * discountPercent) / 100;
        const maxDiscount = voucher.maxDiscountValue || discount;
        discountedPrice = Math.max(0, originalPrice - Math.min(discount, maxDiscount));
      } else if (isActive && voucher.type === 'FIXED' && voucher.discountValue) {
        discountedPrice = Math.max(0, originalPrice - voucher.discountValue);
        if (originalPrice > 0) {
          discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        }
      }
    }
  }

  const hasDiscount = discountPercent > 0 && discountedPrice < originalPrice;

  return {
    originalPrice,
    finalPrice: hasDiscount ? discountedPrice : originalPrice,
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

