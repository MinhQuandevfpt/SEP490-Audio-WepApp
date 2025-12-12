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
    let originalPrice = item.price ?? 0;
    let finalPrice = item.finalPrice ?? item.price ?? 0;
    let discountPercent = 0;
    
    // Nếu có variants, lấy giá thấp nhất từ variants
    if (item.variants && item.variants.length > 0) {
      const variantPrices = item.variants
        .filter(v => v.price > 0)
        .map(v => v.price);
      if (variantPrices.length > 0) {
        const minVariantPrice = Math.min(...variantPrices);
        originalPrice = minVariantPrice;
        // Nếu API chưa tính finalPrice, dùng minVariantPrice
        if (!item.finalPrice && !item.price) {
          finalPrice = minVariantPrice;
        }
      }
    }
    
    // Tính discount percent từ finalPrice và originalPrice
    if (originalPrice > 0 && finalPrice < originalPrice) {
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