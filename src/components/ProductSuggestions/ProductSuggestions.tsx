import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
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

  const fetchProducts = async (page: number, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProductListService.getProducts({
        page: page,
        size: itemsPerPage,
        status: 'ACTIVE' // Chỉ lấy sản phẩm đang active
      });

      console.log('📦 API Response:', response);

      if (response && response.data) {
        let newProducts: Product[] = [];
        let total = 0;
        let isLast = true;
        
        // Handle both array and pagination response
        if (Array.isArray(response.data)) {
          // Data is array directly
          newProducts = response.data;
          total = response.data.length;
          isLast = true;
        } else {
          // Data has pagination structure
          newProducts = response.data.content || [];
          total = response.data.totalElements || 0;
          isLast = response.data.last ?? true;
        }

        console.log('✅ Processed products:', {
          count: newProducts.length,
          total,
          isLast,
          page
        });
        
        setProducts(prev => reset ? newProducts : [...prev, ...newProducts]);
        setTotalElements(total);
        setHasMore(!isLast);
        setCurrentPage(page);
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
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
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

      {/* Loading State */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(17)].map((_, index) => (
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
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang tải...</span>
                  </span>
                ) : (
                  `Xem thêm sản phẩm (${remainingProducts} sản phẩm)`
                )}
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

export default ProductSuggestions;