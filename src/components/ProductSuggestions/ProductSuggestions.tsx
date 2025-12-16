import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { type Product } from '../../services/customer/ProductListService';
import { ProductViewService, type ProductViewItem } from '../../services/customer/ProductViewService';
import SimpleProductCard from '../ProductCard/SimpleProductCard';

const ProductSuggestions: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  const itemsPerPage = 17; // Hiển thị 17 sản phẩm mỗi lần

  // Fetch products from API
  useEffect(() => {
    fetchProducts(0, true);
  }, []);

  const mapToProduct = (item: ProductViewItem): Product => {
    // API đã tính sẵn finalPrice, nhưng chúng ta cần xử lý variants và vouchers
    let originalPrice: number = 0;
    let finalPrice: number = 0;
    let discountPercent = 0;
    
    // Xử lý giá: Ưu tiên từ variants nếu có, sau đó mới dùng price từ root
    if (item.variants && item.variants.length > 0) {
      // Nếu có variants, lấy giá từ variants
      const variantPrices = item.variants
        .filter(v => v.price > 0)
        .map(v => v.price);
      if (variantPrices.length > 0) {
        const minVariantPrice = Math.min(...variantPrices);
        
        // Dùng giá thấp nhất từ variants để hiển thị
        originalPrice = minVariantPrice;
        
        // Xử lý finalPrice từ API:
        // 1. Nếu API đã tính finalPrice ở root level và khác originalPrice, dùng nó (đã có discount)
        // 2. Nếu không, tạm thời set = originalPrice để tính từ campaign sau
        if (item.finalPrice !== null && item.finalPrice !== undefined && item.finalPrice !== minVariantPrice) {
          // Backend đã tính sẵn finalPrice và có discount (khác giá gốc)
          finalPrice = item.finalPrice;
        } else {
          // Chưa có finalPrice hoặc finalPrice = giá gốc, tạm thời set = originalPrice
          // Sẽ tính lại từ campaign nếu có
          finalPrice = minVariantPrice;
        }
      } else {
        // Variants không có giá hợp lệ, fallback về price từ root
        originalPrice = item.price ?? 0;
        finalPrice = item.finalPrice ?? item.price ?? 0;
      }
    } else {
      // Không có variants, dùng giá từ root level
      originalPrice = item.price ?? 0;
      // Nếu finalPrice đã được tính và khác originalPrice, dùng nó (đã có discount)
      // Nếu không, set = originalPrice để tính từ campaign sau
      if (item.finalPrice !== null && item.finalPrice !== undefined && item.finalPrice !== originalPrice) {
        finalPrice = item.finalPrice;
      } else {
        finalPrice = originalPrice;
      }
    }
    
    // Nếu discountPrice và finalPrice đều null/0 hoặc finalPrice = originalPrice (chưa có discount),
    // và sản phẩm có campaign, tính giá sau giảm từ campaign
    const hasCampaign = item.vouchers?.platformVouchers && item.vouchers.platformVouchers.length > 0;
    const needsCampaignCalculation = 
      (item.discountPrice === null || item.discountPrice === undefined) &&
      (item.finalPrice === null || item.finalPrice === undefined || finalPrice === originalPrice) &&
      originalPrice > 0 &&
      hasCampaign;
    
    if (needsCampaignCalculation && hasCampaign && item.vouchers?.platformVouchers) {
      // Lấy campaign đầu tiên
      const campaign = item.vouchers.platformVouchers[0];
      
      // Lấy voucher active từ campaign
      if (campaign.vouchers && campaign.vouchers.length > 0) {
        const voucher = campaign.vouchers[0];
        const now = new Date();
        
        // Kiểm tra voucher có active không
        let isActive = false;
        
        // Kiểm tra thời gian voucher (có thể có slot time cho Flash Sale)
        if (voucher.slotOpenTime && voucher.slotCloseTime) {
          // Flash Sale: check slot time và slot status
          const slotOpen = new Date(voucher.slotOpenTime);
          const slotClose = new Date(voucher.slotCloseTime);
          isActive =
            now >= slotOpen &&
            now <= slotClose &&
            voucher.slotStatus === 'ACTIVE';
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
        
        console.log(`🎁 [CAMPAIGN] Product: ${item.name}`, {
          hasCampaign: true,
          voucherType: voucher.type,
          discountPercent: voucher.discountPercent,
          discountValue: voucher.discountValue,
          status: voucher.status,
          isActive,
          originalPrice,
          currentFinalPrice: finalPrice,
        });
        
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
            
            console.log(`✅ [CAMPAIGN] Calculated PERCENT discount:`, {
              originalPrice,
              discountPercent: voucher.discountPercent,
              discountAmount,
              maxDiscountValue: voucher.maxDiscountValue,
              finalDiscount,
              finalPrice,
            });
          } else if (voucher.type === 'FIXED' && voucher.discountValue) {
            // FIXED: price - discountValue
            finalPrice = Math.max(0, originalPrice - voucher.discountValue);
            // Tính discountPercent từ discountValue
            if (originalPrice > 0) {
              discountPercent = Math.round(((voucher.discountValue / originalPrice) * 100));
            }
            
            console.log(`✅ [CAMPAIGN] Calculated FIXED discount:`, {
              originalPrice,
              discountValue: voucher.discountValue,
              finalPrice,
              discountPercent,
            });
          }
        } else {
          console.log(`⚠️ [CAMPAIGN] Voucher not active:`, {
            status: voucher.status,
            hasSlotTime: !!(voucher.slotOpenTime && voucher.slotCloseTime),
            hasVoucherTime: !!(voucher.startTime && voucher.endTime),
          });
        }
      }
    } else if (hasCampaign) {
      console.log(`ℹ️ [CAMPAIGN] Product has campaign but calculation skipped:`, {
        productName: item.name,
        discountPrice: item.discountPrice,
        finalPrice: item.finalPrice,
        calculatedFinalPrice: finalPrice,
        originalPrice,
        needsCalculation: needsCampaignCalculation,
      });
    }
    
    // Fallback: Nếu finalPrice vẫn là 0 (chưa được set), dùng originalPrice
    if (finalPrice === 0 && originalPrice > 0) {
      finalPrice = originalPrice;
    }
    
    // Tính discount percent từ finalPrice và originalPrice (nếu chưa tính)
    if (discountPercent === 0 && originalPrice > 0 && finalPrice > 0 && finalPrice < originalPrice) {
      discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }
    
    // Lấy category name từ categories array (lấy category đầu tiên hoặc join nếu nhiều)
    const categoryName = item.categories && item.categories.length > 0
      ? item.categories.map(c => c.categoryName).join(', ')
      : '';

    return {
      productId: item.productId,
      storeId: item.store?.id || '',
      storeName: item.store?.name || '',
      categoryId: item.categories && item.categories.length > 0 ? item.categories[0].categoryId : '',
      categoryName: categoryName,
      brandName: item.brandName || '',
      name: item.name,
      slug: '',
      shortDescription: '',
      description: '',
      model: '',
      color: '',
      material: '',
      dimensions: '',
      weight: 0,
      variants: [],
      images: item.thumbnailUrl ? [item.thumbnailUrl] : [],
      videoUrl: null,
      sku: '',
      price: originalPrice,
      discountPrice: discountPercent > 0 ? finalPrice : null,
      promotionPercent: discountPercent > 0 ? discountPercent : null,
      priceAfterPromotion: finalPrice,
      priceBeforeVoucher: originalPrice,
      voucherAmount: null,
      finalPrice: finalPrice,
      platformFeePercent: null,
      currency: 'VND',
      stockQuantity: 0,
      warehouseLocation: null,
      provinceCode: item.store?.provinceCode || null,
      districtCode: item.store?.districtCode || null,
      wardCode: item.store?.wardCode || null,
      shippingAddress: null,
      shippingFee: null,
      supportedShippingMethodIds: [],
      bulkDiscounts: [],
      status: item.status || 'ACTIVE',
      isFeatured: false,
      ratingAverage: item.ratingAverage ?? null,
      reviewCount: item.reviewCount ?? null,
      viewCount: null,
      createdAt: '',
      updatedAt: '',
      lastUpdatedAt: '',
      lastUpdateIntervalDays: 0,
      createdBy: '',
      updatedBy: '',
    } as Product;
  };

  const fetchProducts = async (page: number, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Chỉ lấy sản phẩm ACTIVE cho customer UI
      // Không dùng keyword (dành cho search box)
      const response = await ProductViewService.getProductViews({
        page: page,
        size: itemsPerPage,
        status: 'ACTIVE', // Chỉ lấy sản phẩm đang active
        // Có thể thêm sortBy và sortDir nếu muốn sắp xếp
        // sortBy: 'name',
        // sortDir: 'asc',
      });

      console.log('📦 API Response:', response);

      if (response && response.data && response.data.data) {
        const items = response.data.data || [];
        const pageInfo = response.data.page;

        // Map API response to Product type
        const newProducts: Product[] = items.map(mapToProduct);
        
        // Extract pagination info
        const total = pageInfo?.totalElements ?? 0;
        const currentPageNum = pageInfo?.pageNumber ?? page;
        const totalPages = pageInfo?.totalPages ?? 1;
        const isLast = currentPageNum >= totalPages - 1 || newProducts.length < itemsPerPage;

        console.log('✅ Processed products:', {
          count: newProducts.length,
          total,
          currentPage: currentPageNum,
          totalPages,
          isLast,
          page
        });
        
        setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
        setTotalElements(total);
        setHasMore(!isLast);
        setCurrentPage(currentPageNum);
      } else {
        // Handle empty or invalid response
        setProducts(prev => reset ? [] : prev);
        setTotalElements(0);
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      // Keep previous products on error (don't clear them)
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchProducts(currentPage + 1, false);
    }
  };

  const remainingProducts = totalElements - products.length;

  if (error) {
    return null; // Không hiển thị error, return null để tránh làm gián đoạn UX
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-7 h-7 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Gợi ý sản phẩm hôm nay</h2>
        </div>
      </div>

      {/* Loading State - Chỉ hiển thị skeleton khi chưa có products */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Products Grid - 5 sản phẩm mỗi hàng */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <SimpleProductCard key={product.productId} product={product} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang tải...' : `Xem thêm sản phẩm (${remainingProducts} sản phẩm)`}
              </button>
            </div>
          )}

          {/* No More Products */}
          {!hasMore && products.length > 0 && (
            <div className="text-center mt-8 text-gray-500">
              Đã hiển thị tất cả {totalElements} sản phẩm
            </div>
          )}

          {/* No Products Found */}
          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(ProductSuggestions);