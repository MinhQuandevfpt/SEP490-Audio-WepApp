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
    // Calculate discount ONLY from platform vouchers (Flash Sale, Mega Sale, etc.)
    // Ignore shop vouchers for display
    let discountPercent = 0;
    let discountedPrice = item.price ?? 0;
    let originalPrice = item.price ?? 0;
    
    // Check if product has variants and calculate min price
    if (item.variants && item.variants.length > 0) {
      // Get minimum price from variants
      const variantPrices = item.variants.map(v => v.price);
      const minVariantPrice = Math.min(...variantPrices);
      originalPrice = minVariantPrice;
      discountedPrice = minVariantPrice;
    }
    
    // Check platform vouchers ONLY (Flash Sale, etc.)
    if (item.vouchers?.platformVouchers && item.vouchers.platformVouchers.length > 0) {
      const campaign = item.vouchers.platformVouchers[0];
      if (campaign.vouchers && campaign.vouchers.length > 0) {
        const voucher = campaign.vouchers[0];
        
        // Check if voucher is active (within time range)
        const now = new Date();
        let isActive = false;
        
        if (voucher.slotOpenTime && voucher.slotCloseTime) {
          // Flash Sale: check slot time and slot status
          isActive = 
            now >= new Date(voucher.slotOpenTime) && 
            now <= new Date(voucher.slotCloseTime) &&
            voucher.slotStatus === 'ACTIVE';
        } else {
          // Regular campaign: check voucher time
          isActive = 
            now >= new Date(voucher.startTime) && 
            now <= new Date(voucher.endTime) && 
            voucher.status === 'ACTIVE';
        }
        
        if (isActive && voucher.type === 'PERCENT' && voucher.discountPercent) {
          discountPercent = voucher.discountPercent;
          discountedPrice = originalPrice * (1 - discountPercent / 100);
        } else if (isActive && voucher.type === 'FIXED' && voucher.discountValue) {
          discountedPrice = Math.max(0, originalPrice - voucher.discountValue);
          if (originalPrice > 0) {
            discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
          }
        }
      }
    }
    
    // DO NOT check shop voucher - only show original price for shop vouchers

    const hasDiscount = discountPercent > 0;

    return {
      productId: item.productId,
      storeId: item.store?.id || '',
      storeName: item.store?.name || '',
      categoryId: '',
      categoryName: item.category || '',
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
      discountPrice: hasDiscount ? discountedPrice : null,
      promotionPercent: hasDiscount ? discountPercent : null,
      priceAfterPromotion: hasDiscount ? discountedPrice : originalPrice,
      priceBeforeVoucher: originalPrice,
      voucherAmount: null,
      finalPrice: hasDiscount ? discountedPrice : originalPrice,
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
      status: item.store?.status || 'ACTIVE',
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
      
      const response = await ProductViewService.getProductViews({
        page: page,
        size: itemsPerPage,
        // Không truyền status để tránh lỗi enum từ backend
      });

      console.log('📦 API Response:', response);

      if (response && response.data) {
        const items = response.data.data || [];
        const pageInfo = response.data.page;

        const newProducts: Product[] = items.map(mapToProduct);
        const total = pageInfo?.totalElements ?? newProducts.length;
        const currentPage = pageInfo?.pageNumber ?? page;
        const totalPages = pageInfo?.totalPages ?? (newProducts.length < itemsPerPage ? currentPage + 1 : currentPage + 2);
        const isLast = currentPage >= totalPages - 1 || newProducts.length < itemsPerPage;

        console.log('✅ Processed products:', {
          count: newProducts.length,
          total,
          isLast,
          page
        });
        
        setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
        setTotalElements(total);
        setHasMore(!isLast);
        setCurrentPage(currentPage);
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
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