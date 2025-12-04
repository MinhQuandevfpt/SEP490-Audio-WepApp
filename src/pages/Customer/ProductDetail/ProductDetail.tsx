import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { ProductListService, type Product } from '../../../services/customer/ProductListService';
import { ProductViewService, type ProductVoucherItem, type ProductDetailPlatformCampaign } from '../../../services/customer/ProductViewService';
import ImageGallery from '../../../components/ProductDetailComponents/ImageGallery';
import StoreInfo from '../../../components/ProductDetailComponents/StoreInfo';
import TitlePrice from '../../../components/ProductDetailComponents/TitlePrice';
import PurchaseActions from '../../../components/ProductDetailComponents/PurchaseActions';
import ProductTabs from '../../../components/ProductDetailComponents/tabs/ProductTabs';
import ProductVouchers from '../../../components/ProductDetailComponents/ProductVouchers';
import { translatePlacementType } from '../../../components/CreateProductForSellerUIComponent/CategorySpecsSchema';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<ProductVoucherItem[]>([]);
  const [platformCampaigns, setPlatformCampaigns] = useState<ProductDetailPlatformCampaign[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  
  // Variant selection state
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [hoveredVariantImage, setHoveredVariantImage] = useState<string | null>(null);

  useEffect(() => {
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (id) {
      // Reset states
      setLoading(true);
      setError(null);
      setProduct(null);
      setSelectedVariant(null);
      setHoveredVariantImage(null);
      
      // Fetch both APIs in parallel and wait for both
      fetchBothAPIs(id);
    }
  }, [id]);

  // No longer needed - we don't update images array
  // useEffect(() => {
  //   if (product && product.images && product.images.length > 0) {
  //     setSelectedImages(product.images);
  //   }
  // }, [product]);

  const fetchBothAPIs = async (productId: string) => {
    try {
      setLoading(true);
      
      // Fetch both in parallel
      const [productResponse, voucherResponse] = await Promise.all([
        ProductListService.getProductById(productId),
        ProductViewService.getProductVouchers(productId).catch(e => {
          console.warn('Không thể tải voucher sản phẩm:', e);
          return null;
        })
      ]);

      // Set product data
      if (productResponse && productResponse.data) {
        setProduct(productResponse.data);
      } else {
        setError('Không tìm thấy sản phẩm');
      }

      // Set voucher data
      if (voucherResponse) {
        const shopVouchers = voucherResponse?.data?.vouchers?.shop || [];
        const platformVouchers = voucherResponse?.data?.vouchers?.platform || [];
        setVouchers(shopVouchers);
        setPlatformCampaigns(platformVouchers);
      } else {
        setVouchers([]);
        setPlatformCampaigns([]);
      }
      
    } catch (err) {
      console.error('Error loading product detail:', err);
      setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setVouchersLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <div className="animate-pulse bg-gray-200 aspect-square rounded-lg"></div>
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Không tìm thấy sản phẩm'}
            </h2>
            <button
              onClick={() => window.history.back()}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/images/placeholder-product.png'];

  const specs = [
    { key: 'Danh mục', value: product.categoryName },
    { key: 'Thương hiệu', value: product.brandName },
    { key: 'Model', value: product.model || 'N/A' },
    { key: 'Chất liệu', value: product.material || 'N/A' },
    { key: 'Kích thước', value: product.dimensions || 'N/A' },
    { key: 'Trọng lượng', value: product.weight ? `${product.weight} kg` : 'N/A' },
    { key: 'SKU', value: product.sku || 'N/A' },
    ...(product.frequencyResponse ? [{ key: 'Dải tần số', value: product.frequencyResponse }] : []),
    ...(product.sensitivity ? [{ key: 'Độ nhạy', value: product.sensitivity }] : []),
    ...(product.impedance ? [{ key: 'Trở kháng', value: product.impedance }] : []),
    ...(product.connectionType ? [{ key: 'Kết nối', value: product.connectionType }] : []),
    ...(product.warrantyPeriod ? [{ key: 'Bảo hành', value: product.warrantyPeriod }] : []),
    ...(product.placementType ? [{ key: 'Vị trí đặt', value: translatePlacementType(product.placementType) }] : []),
  ];

  // Calculate price with variants and platform vouchers
  const calculateFinalPrice = () => {
    const hasVariants = product.variants && product.variants.length > 0;
    let originalPrice = product.price;
    let displayPrice = product.price;
    let priceRangeText: string | null = null;
    let discountedPriceRangeText: string | null = null;
    
    // Get platform voucher info first
    let discountPercent = 0;
    let campaignBadge: { label: string; color: string } | null = null;
    let voucherType: 'PERCENT' | 'FIXED' | null = null;
    let voucherDiscountValue = 0;
    let voucherMaxDiscount: number | null = null;

    if (platformCampaigns.length > 0) {
      const campaign = platformCampaigns[0];
      const voucher = campaign.vouchers?.[0];
      
      if (voucher && voucher.status === 'ACTIVE') {
        const now = new Date();
        
        // For Flash Sale with slot, check slot time instead of voucher time
        let isActive = false;
        if (voucher.slotOpenTime && voucher.slotCloseTime) {
          // Flash Sale: check slot time and slot status
          isActive = 
            now >= new Date(voucher.slotOpenTime) && 
            now <= new Date(voucher.slotCloseTime) &&
            voucher.slotStatus === 'ACTIVE';
        } else {
          // Regular campaign: check voucher time
          isActive = now >= new Date(voucher.startTime) && now <= new Date(voucher.endTime);
        }
        
        if (isActive) {
          if (voucher.type === 'PERCENT' && voucher.discountPercent) {
            voucherType = 'PERCENT';
            discountPercent = voucher.discountPercent;
            voucherMaxDiscount = voucher.maxDiscountValue || null;
          } else if (voucher.type === 'FIXED' && voucher.discountValue) {
            voucherType = 'FIXED';
            voucherDiscountValue = voucher.discountValue;
          }
          
          campaignBadge = {
            label: campaign.badgeLabel || 'FLASH SALE',
            color: campaign.badgeColor || '#FF6600'
          };
        }
      }
    }

    // Helper function to calculate discounted price
    const applyDiscount = (price: number): number => {
      if (voucherType === 'PERCENT') {
        const discount = (price * discountPercent) / 100;
        const maxDiscount = voucherMaxDiscount || discount;
        return price - Math.min(discount, maxDiscount);
      } else if (voucherType === 'FIXED') {
        return Math.max(0, price - voucherDiscountValue);
      }
      return price;
    };

    // If product has variants
    if (hasVariants) {
      if (selectedVariant) {
        // Show selected variant price
        originalPrice = selectedVariant.variantPrice;
        displayPrice = applyDiscount(originalPrice);
      } else {
        // Show price range for both original and discounted
        const prices = product.variants!.map(v => v.variantPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          originalPrice = minPrice;
          displayPrice = applyDiscount(minPrice);
        } else {
          // Always show original price range
          priceRangeText = `${minPrice.toLocaleString('vi-VN')}₫ - ${maxPrice.toLocaleString('vi-VN')}₫`;
          
          // Only calculate discounted price range if there's an active discount
          if (voucherType) {
            const minDiscountedPrice = applyDiscount(minPrice);
            const maxDiscountedPrice = applyDiscount(maxPrice);
            discountedPriceRangeText = `${minDiscountedPrice.toLocaleString('vi-VN')}₫ - ${maxDiscountedPrice.toLocaleString('vi-VN')}₫`;
          }
          
          originalPrice = minPrice;
          displayPrice = applyDiscount(minPrice);
        }
      }
    } else {
      // Single product without variants
      displayPrice = applyDiscount(originalPrice);
    }

    return {
      originalPrice,
      finalPrice: displayPrice,
      displayPrice,
      priceRangeText,
      discountedPriceRangeText,
      discountPercent,
      campaignBadge,
      hasDiscount: voucherType !== null && (displayPrice < originalPrice || discountPercent > 0)
    };
  };

  const priceInfo = calculateFinalPrice();

  // Handle variant selection
  const handleVariantSelect = (variant: any) => {
    if (selectedVariant?.variantId === variant.variantId) {
      // Deselect - back to original images and price range
      setSelectedVariant(null);
      setHoveredVariantImage(null);
    } else {
      // Select new variant - set permanent image override
      setSelectedVariant(variant);
      setHoveredVariantImage(variant.variantUrl || null);
    }
  };

  // Handle variant hover
  const handleVariantHover = (variant: any | null) => {
    if (variant && variant.variantUrl) {
      // Show variant image on hover (temporary)
      setHoveredVariantImage(variant.variantUrl);
    } else if (!selectedVariant) {
      // If not hovering and no variant selected, clear override
      setHoveredVariantImage(null);
    } else if (selectedVariant) {
      // If hovering ended but variant is selected, show selected variant image
      setHoveredVariantImage(selectedVariant.variantUrl || null);
    }
  };

  const hasVariants = product.variants && product.variants.length > 0;
  
  // Backend already calculates total stock (sum of variants if has variants, or stockQuantity)
  const totalStock = product.stockQuantity;
  const isInStock = totalStock > 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
     
          <div className="lg:col-span-5">
            <ImageGallery 
              images={images}
              videoUrl={product.videoUrl}
              mainImageOverride={hoveredVariantImage || undefined}
            />
          </div>

          
          <div className="lg:col-span-7 space-y-4">
            <TitlePrice 
              name={product.name}
              brand={product.brandName}
              rating={product.ratingAverage || 0}
              reviewsCount={product.reviewCount || 0}
              soldCount={0} // API doesn't provide this
              price={priceInfo.originalPrice}
              priceRange={priceInfo.priceRangeText}
              discountedPriceRange={priceInfo.discountedPriceRangeText}
              salePrice={priceInfo.hasDiscount ? priceInfo.finalPrice : undefined}
              discountPercent={priceInfo.discountPercent}
              campaignBadge={priceInfo.campaignBadge}
              shortDescription={product.shortDescription}
              productId={product.productId}
            />
       
            {!vouchersLoading && vouchers.length > 0 && (
              <ProductVouchers vouchers={vouchers} />
            )}
            
            <PurchaseActions 
              productId={product.productId}
              productName={product.name}
              productImage={hoveredVariantImage || images[0]}
              productPrice={priceInfo.finalPrice}
              inStock={isInStock}
              totalStock={totalStock}
              selectedVariant={selectedVariant}
              variants={hasVariants ? product.variants : undefined}
              onVariantSelect={handleVariantSelect}
              onVariantHover={handleVariantHover}
            />
          </div>
        </div>

       
        <StoreInfo 
          storeId={product.storeId}
          storeName={product.storeName}
          storeAvatar={undefined} 
        />

       
        <ProductTabs 
          description={product.description ? [product.description] : []} 
          specs={specs}
          productId={product.productId}
        />
      </div>
    </Layout>
  );
};

export default ProductDetail;


