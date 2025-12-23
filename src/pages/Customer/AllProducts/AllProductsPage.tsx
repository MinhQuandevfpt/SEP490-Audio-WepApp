import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../../../components/Layout';
import { type Product } from '../../../services/customer/ProductListService';
import { ProductViewService, type ProductViewItem } from '../../../services/customer/ProductViewService';
import SimpleProductCard from '../../../components/ProductCard/SimpleProductCard';

const ITEMS_PER_PAGE = 50;

const AllProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Lấy page từ URL params (1-based)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? Math.max(0, parseInt(pageParam) - 1) : 0;
    setCurrentPage(page);
  }, [searchParams]);

  // Map API response to Product type (reuse logic from ProductSuggestions)
  const mapToProduct = (item: ProductViewItem): Product => {
    let originalPrice: number = 0;
    let finalPrice: number = 0;
    let discountPercent = 0;

    // Xử lý giá: Ưu tiên từ variants nếu có, sau đó mới dùng price từ root
    if (item.variants && item.variants.length > 0) {
      const variantPrices = item.variants
        .filter(v => v.price > 0)
        .map(v => v.price);
      if (variantPrices.length > 0) {
        const minVariantPrice = Math.min(...variantPrices);
        originalPrice = minVariantPrice;

        if (item.finalPrice !== null && item.finalPrice !== undefined && item.finalPrice !== minVariantPrice) {
          finalPrice = item.finalPrice;
        } else {
          finalPrice = minVariantPrice;
        }
      } else {
        originalPrice = item.price ?? 0;
        finalPrice = item.finalPrice ?? item.price ?? 0;
      }
    } else {
      originalPrice = item.price ?? 0;
      if (item.finalPrice !== null && item.finalPrice !== undefined && item.finalPrice !== originalPrice) {
        finalPrice = item.finalPrice;
      } else {
        finalPrice = originalPrice;
      }
    }

    // Xử lý campaign/voucher discount
    const hasCampaign = item.vouchers?.platformVouchers && item.vouchers.platformVouchers.length > 0;
    const needsCampaignCalculation =
      (item.discountPrice === null || item.discountPrice === undefined) &&
      (item.finalPrice === null || item.finalPrice === undefined || finalPrice === originalPrice) &&
      originalPrice > 0 &&
      hasCampaign;

    if (needsCampaignCalculation && hasCampaign && item.vouchers?.platformVouchers) {
      const campaign = item.vouchers.platformVouchers[0];
      if (campaign.vouchers && campaign.vouchers.length > 0) {
        const voucher = campaign.vouchers[0];
        const now = new Date();
        let isActive = false;

        if (voucher.slotOpenTime && voucher.slotCloseTime) {
          const slotOpen = new Date(voucher.slotOpenTime);
          const slotClose = new Date(voucher.slotCloseTime);
          isActive = now >= slotOpen && now <= slotClose && voucher.slotStatus === 'ACTIVE';
        } else if (voucher.startTime && voucher.endTime) {
          const startTime = new Date(voucher.startTime);
          const endTime = new Date(voucher.endTime);
          isActive = now >= startTime && now <= endTime && voucher.status === 'ACTIVE';
        } else {
          isActive = voucher.status === 'ACTIVE';
        }

        if (isActive) {
          if (voucher.type === 'PERCENT' && voucher.discountPercent) {
            const discountAmount = (originalPrice * voucher.discountPercent) / 100;
            const finalDiscount = voucher.maxDiscountValue
              ? Math.min(discountAmount, voucher.maxDiscountValue)
              : discountAmount;
            finalPrice = Math.max(0, originalPrice - finalDiscount);
            discountPercent = voucher.discountPercent;
          } else if (voucher.type === 'FIXED' && voucher.discountValue) {
            finalPrice = Math.max(0, originalPrice - voucher.discountValue);
            if (originalPrice > 0) {
              discountPercent = Math.round(((voucher.discountValue / originalPrice) * 100));
            }
          }
        }
      }
    }

    if (finalPrice === 0 && originalPrice > 0) {
      finalPrice = originalPrice;
    }

    if (discountPercent === 0 && originalPrice > 0 && finalPrice > 0 && finalPrice < originalPrice) {
      discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }

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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ProductViewService.getProductViews({
          page: currentPage,
          size: ITEMS_PER_PAGE,
          status: 'ACTIVE',
        });

        if (response && response.data && response.data.data) {
          const items = response.data.data || [];
          const pageInfo = response.data.page;

          const mappedProducts: Product[] = items.map(mapToProduct);

          setProducts(mappedProducts);
          setTotalPages(pageInfo?.totalPages ?? 1);

          // Update URL with current page (1-based)
          const newParams = new URLSearchParams(searchParams);
          if (currentPage === 0) {
            newParams.delete('page');
          } else {
            newParams.set('page', String(currentPage + 1));
          }
          setSearchParams(newParams, { replace: true });
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('❌ Error fetching products:', err);
        setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchParams, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Hiển thị tất cả các trang
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị với ellipsis
      if (currentPage < 3) {
        // Đầu danh sách
        for (let i = 0; i < 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        // Cuối danh sách
        pages.push(0);
        pages.push('ellipsis');
        for (let i = totalPages - 5; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Giữa danh sách
        pages.push(0);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      }
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 0 || loading}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Trước</span>
        </button>

        <div className="flex gap-2">
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={loading}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <span>Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Tất cả sản phẩm
          </h1>
        </div>

        {/* Loading State */}
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
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <SimpleProductCard key={product.productId} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AllProductsPage;

