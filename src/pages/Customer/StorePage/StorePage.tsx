import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, MessageCircle, Search } from 'lucide-react';
import Layout from '../../../components/Layout';
import SimpleProductCard from '../../../components/ProductCard/SimpleProductCard';
import { type Product } from '../../../services/customer/ProductListService';
import { ProductViewService, type ProductViewItem } from '../../../services/customer/ProductViewService';
import { CustomerStoreService, type StoreDetailResponse } from '../../../services/customer/StoreService';
import { useChatContext } from '../../../contexts/ChatContext';
import { CustomerAuthService } from '../../../services/customer/Authcustomer';

const StorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const chatContext = useChatContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeData, setStoreData] = useState<StoreDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Map ProductViewItem to Product (same logic as ProductSuggestions)
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

    // Lấy category name từ categories array (lấy category đầu tiên hoặc join nếu nhiều)
    const categoryName = item.categories && item.categories.length > 0
      ? item.categories.map(c => c.categoryName).join(', ')
      : '';

    const hasDiscount = discountPercent > 0;

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
      discountPrice: hasDiscount ? finalPrice : null,
      promotionPercent: hasDiscount ? discountPercent : null,
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

  const loadProducts = async (pageNum: number = 0, append: boolean = false) => {
    if (!storeId) return;

    try {
      setLoading(true);
      const response = await ProductViewService.getProductViews({
        storeId,
        page: pageNum,
        size: 20,
        status: 'ACTIVE'
      });

      console.log('📦 API Response:', response);

      if (response && response.data) {
        const items = response.data.data || [];
        const pageInfo = response.data.page;

        // Set store name from first product
        if (!append && items.length > 0 && items[0].store?.name) {
          setStoreName(items[0].store.name);
        }

        // Map to Product format
        const newProducts: Product[] = items.map(mapToProduct);

        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        // Check if it's the last page
        const isLast = pageInfo.pageNumber >= pageInfo.totalPages - 1;
        setHasMore(!isLast);
      }
    } catch (error) {
      console.error('Error loading store products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load store details
  useEffect(() => {
    const loadStoreDetails = async () => {
      if (!storeId) return;
      
      try {
        setStoreLoading(true);
        const data = await CustomerStoreService.getStoreById(storeId);
        setStoreData(data);
        setStoreName(data.storeName);
      } catch (error) {
        console.error('Error loading store details:', error);
      } finally {
        setStoreLoading(false);
      }
    };
    
    loadStoreDetails();
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      loadProducts(0, false);
    }
  }, [storeId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage, true);
  };

  const handleChatWithStore = () => {
    // Check if user is logged in
    if (!CustomerAuthService.isAuthenticated()) {
      // Redirect to login page
      navigate('/auth/login');
      return;
    }
    
    // Open chat with this store
    chatContext.openChat('store', storeId);
  };

  const defaultAvatar = storeName 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=128`
    : '';
  
  // Use logo from API if available, otherwise use default
  const storeAvatar = storeData?.logoUrl || defaultAvatar;
  const storeCover = storeData?.coverImageUrl;

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map(p => p.categoryName).filter(Boolean))
  ).sort() as string[];

  // Filter products based on search query and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      product.categoryName === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Store Cover & Header Section */}
        <div className="relative">
          {/* Cover Image - Full Width */}
          <div className="w-full h-72 relative overflow-hidden bg-gradient-to-r from-orange-200 via-orange-100 to-blue-200">
            {storeCover && (
              <img
                src={storeCover}
                alt="Store Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            
            {/* Overlay gradient for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />

            {/* Content Container - Aligned with header */}
            <div className="absolute inset-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
                {/* Search Bar - Top Right, Centered Vertically */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 lg:right-8 w-72 md:w-80 lg:w-96 z-10">
                  <div className="bg-white shadow-lg flex items-center">
                    <input
                      type="text"
                      placeholder="Tìm trong shop..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          // Handle search if needed
                        }
                      }}
                      className="flex-1 px-3 md:px-4 py-2 md:py-2.5 focus:outline-none text-xs md:text-sm"
                    />
                    <button
                      onClick={() => {
                        // Handle search action
                      }}
                      className="px-4 md:px-5 py-2 md:py-2.5 bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
                    >
                      <Search className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>

                {/* Store Info Overlay - Positioned at center left */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 pr-0 md:pr-96">
                  <div className="flex items-center gap-4 md:gap-6">
                  {/* Store Avatar Column */}
                  <div className="flex-shrink-0">
                    {storeLoading ? (
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                        <img
                          src={storeAvatar}
                          alt={storeName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = defaultAvatar;
                          }}
                        />
                      </div>
                    )}
                    {/* Chat Button below avatar */}
                    <button
                      onClick={handleChatWithStore}
                      className="mt-2 md:mt-3 w-20 md:w-28 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-white text-orange-600 hover:bg-orange-50 transition-all hover:shadow-md text-xs md:text-sm font-medium"
                    >
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden md:inline">Chat</span>
                    </button>
                  </div>

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    {storeLoading ? (
                      <div className="space-y-2">
                        <div className="h-6 md:h-8 w-48 md:w-64 bg-white/80 rounded animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg truncate">
                          {storeName || 'Đang tải...'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                            <Store className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            <span className="text-white font-medium">
                              {products.length} Sản Phẩm
                            </span>
                          </div>
                          {storeData?.rating && storeData.rating > 0 && (
                            <div className="flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                              <span className="text-white font-medium">
                                ⭐ {storeData.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* White Category Tabs Section - Half overlapping cover, half below */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
            <div className="bg-white shadow-sm py-3 px-4">
              {/* Category Tabs */}
              <div 
                className="category-tabs flex items-center gap-6 md:gap-8 overflow-x-auto"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* All Categories Tab */}
                <div
                  onClick={() => setSelectedCategory(null)}
                  className="group flex-shrink-0 cursor-pointer font-medium text-sm md:text-base transition-all whitespace-nowrap relative pb-2"
                >
                  <span className={`transition-colors ${
                    selectedCategory === null
                      ? 'text-orange-500'
                      : 'text-gray-600 group-hover:text-orange-500'
                  }`}>
                    Tất cả
                  </span>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 transition-opacity ${
                    selectedCategory === null ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}></div>
                </div>
                
                {/* Category Tabs */}
                {categories.map((category) => (
                  <div
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="group flex-shrink-0 cursor-pointer font-medium text-sm md:text-base transition-all whitespace-nowrap relative pb-2"
                  >
                    <span className={`transition-colors ${
                      selectedCategory === category
                        ? 'text-orange-500'
                        : 'text-gray-600 group-hover:text-orange-500'
                    }`}>
                      {category}
                    </span>
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 transition-opacity ${
                      selectedCategory === category ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <style>{`
            .category-tabs::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Products Section */}
          <div className="bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Sản phẩm của cửa hàng
              </h2>
              {searchQuery && (
                <span className="text-sm text-gray-600">
                  Tìm thấy <span className="font-semibold text-orange-600">{filteredProducts.length}</span> sản phẩm
                </span>
              )}
            </div>

            {loading && page === 0 ? (
              // Initial Loading Skeleton
              <div className="grid grid-cols-5 gap-4">
                {[...Array(20)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              // Empty State
              <div className="text-center py-16">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery 
                    ? `Không tìm thấy sản phẩm "${searchQuery}"`
                    : 'Cửa hàng chưa có sản phẩm nào'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <SimpleProductCard
                      key={product.productId}
                      product={product}
                    />
                  ))}
                </div>

                {/* Load More Button - Only show if not searching */}
                {!searchQuery && hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Đang tải...' : 'Xem thêm sản phẩm'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StorePage;
