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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (id) {
      // Reset states
      setLoading(true);
      setError(null);
      setProduct(null);
      setSelectedVariant(null);
      setSelectedImages([]);
      
      // Fetch both APIs in parallel and wait for both
      fetchBothAPIs(id);
    }
  }, [id]);

  // Set initial images when product loads
  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      setSelectedImages(product.images);
    }
  }, [product]);

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
    { key: 'Màu sắc', value: product.color || 'N/A' },
    { key: 'Chất liệu', value: product.material || 'N/A' },
    { key: 'Kích thước', value: product.dimensions || 'N/A' },
    { key: 'Trọng lượng', value: product.weight ? `${product.weight} kg` : 'N/A' },
    { key: 'SKU', value: product.sku || 'N/A' },
    ...(product.frequencyResponse ? [{ key: 'Dải tần số', value: product.frequencyResponse }] : []),
    ...(product.sensitivity ? [{ key: 'Độ nhạy', value: product.sensitivity }] : []),
    ...(product.impedance ? [{ key: 'Trở kháng', value: product.impedance }] : []),
    ...(product.connectionType ? [{ key: 'Kết nối', value: product.connectionType }] : []),
    ...(product.warrantyPeriod ? [{ key: 'Bảo hành', value: product.warrantyPeriod }] : []),
  ];

  // Calculate price with variants and platform vouchers
  const calculateFinalPrice = () => {
    const hasVariants = product.variants && product.variants.length > 0;
    let originalPrice = product.price;
    let displayPrice = product.price;
    let priceRangeText: string | null = null;
    
    // If product has variants
    if (hasVariants) {
      if (selectedVariant) {
        // Show selected variant price
        originalPrice = selectedVariant.variantPrice;
        displayPrice = selectedVariant.variantPrice;
      } else {
        // Show price range
        const prices = product.variants!.map(v => v.variantPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          originalPrice = minPrice;
          displayPrice = minPrice;
        } else {
          priceRangeText = `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
          originalPrice = minPrice; // Use min for voucher calculation
          displayPrice = minPrice;
        }
      }
    }
    
    let finalPrice = displayPrice;
    let discountPercent = 0;
    let campaignBadge: { label: string; color: string } | null = null;

    // Check platform vouchers first (Flash Sale, etc.)
    if (platformCampaigns.length > 0) {
      const campaign = platformCampaigns[0];
      const voucher = campaign.vouchers?.[0];
      
      if (voucher && voucher.status === 'ACTIVE') {
        const now = new Date();
        const isActive = now >= new Date(voucher.startTime) && now <= new Date(voucher.endTime);
        
        if (isActive && voucher.type === 'PERCENT' && voucher.discountPercent) {
          discountPercent = voucher.discountPercent;
          finalPrice = originalPrice * (1 - discountPercent / 100);
          
          // Add campaign badge
          campaignBadge = {
            label: campaign.badgeLabel || 'FLASH SALE',
            color: campaign.badgeColor || '#FF6600'
          };
        }
      }
    }

    return {
      originalPrice,
      finalPrice,
      displayPrice,
      priceRangeText,
      discountPercent,
      campaignBadge,
      hasDiscount: finalPrice < originalPrice
    };
  };

  const priceInfo = calculateFinalPrice();

  // Handle variant selection
  const handleVariantSelect = (variant: any) => {
    if (selectedVariant?.variantId === variant.variantId) {
      // Deselect - back to original images and price range
      setSelectedVariant(null);
      setSelectedImages(product!.images || []);
    } else {
      // Select new variant
      setSelectedVariant(variant);
      // Update images to show variant image first, then product images
      const variantImages = variant.variantUrl ? [variant.variantUrl, ...(product!.images || [])] : (product!.images || []);
      setSelectedImages(variantImages);
    }
  };

  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
     
          <div className="lg:col-span-5">
            <ImageGallery images={selectedImages.length > 0 ? selectedImages : images} />
          </div>

          
          <div className="lg:col-span-7 space-y-4">
            <TitlePrice 
              name={product.name}
              brand={product.brandName}
              rating={product.ratingAverage || 0}
              reviewsCount={product.reviewCount || 0}
              soldCount={0} // API doesn't provide this
              price={priceInfo.displayPrice}
              priceRange={priceInfo.priceRangeText}
              salePrice={priceInfo.hasDiscount ? priceInfo.finalPrice : undefined}
              discountPercent={priceInfo.discountPercent}
              shortDescription={product.shortDescription}
            />

            {/* Variant Selector - Shopee style */}
            {hasVariants && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Phân loại</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants!.map((variant) => {
                    const isSelected = selectedVariant?.variantId === variant.variantId;
                    return (
                      <button
                        key={variant.variantId}
                        onClick={() => handleVariantSelect(variant)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {variant.variantUrl && (
                          <img
                            src={variant.variantUrl}
                            alt={variant.optionValue}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className={`text-sm ${isSelected ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                          {variant.optionValue}
                        </span>
                        {isSelected && (
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Đã chọn:</span> {selectedVariant.optionName} - {selectedVariant.optionValue}
                    {' '}• <span className="font-semibold text-orange-600">{priceInfo.displayPrice.toLocaleString('vi-VN')}đ</span>
                    {' '}• Kho: <span className={selectedVariant.variantStock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {selectedVariant.variantStock}
                    </span>
                  </div>
                )}
              </div>
            )}
       
            {!vouchersLoading && vouchers.length > 0 && (
              <ProductVouchers vouchers={vouchers} />
            )}
            <PurchaseActions 
              productId={product.productId}
              productName={product.name}
              productImage={selectedImages[0] || images[0]}
              productPrice={priceInfo.finalPrice}
              inStock={product.stockQuantity > 0} 
              selectedVariant={selectedVariant}
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
        />
      </div>
    </Layout>
  );
};

export default ProductDetail;


