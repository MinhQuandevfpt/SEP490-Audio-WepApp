import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, MessageCircle } from 'lucide-react';
import Layout from '../../../components/Layout';
import SimpleProductCard from '../../../components/ProductCard/SimpleProductCard';
import { ProductListService, type Product } from '../../../services/customer/ProductListService';

const StorePage: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadProducts = async (pageNum: number = 0, append: boolean = false) => {
    if (!storeId) return;

    try {
      setLoading(true);
      const response = await ProductListService.getProducts({
        storeId,
        page: pageNum,
        size: 20,
        status: 'ACTIVE'
      });

      // Access data.content from normalized response
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.content || [];

      if (productsData.length > 0) {
        // Set store name from first product
        if (!append && productsData[0].storeName) {
          setStoreName(productsData[0].storeName);
        }

        if (append) {
          setProducts(prev => [...prev, ...productsData]);
        } else {
          setProducts(productsData);
        }

        // Check if it's the last page
        const isLast = Array.isArray(response.data) 
          ? productsData.length < 20 
          : response.data.last || false;
        
        setHasMore(!isLast);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading store products:', error);
    } finally {
      setLoading(false);
    }
  };

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
    // TODO: Implement chat functionality
    console.log('Chat with store:', storeId);
  };

  const storeAvatar = storeName 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=ff6b35&color=fff&size=128`
    : '';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        {/* Store Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            {/* Store Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200">
                {storeAvatar && (
                  <img
                    src={storeAvatar}
                    alt={storeName}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {storeName || 'Đang tải...'}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📦 {products.length} sản phẩm</span>
              </div>
            </div>

            {/* Chat Button */}
            <div>
              <button
                onClick={handleChatWithStore}
                className="flex items-center gap-2 px-6 py-3 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Chat với shop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Sản phẩm của cửa hàng
          </h2>

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
          ) : products.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Cửa hàng chưa có sản phẩm nào</p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-5 gap-4">
                {products.map((product) => (
                  <SimpleProductCard
                    key={product.productId}
                    product={product}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
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
    </Layout>
  );
};

export default StorePage;
