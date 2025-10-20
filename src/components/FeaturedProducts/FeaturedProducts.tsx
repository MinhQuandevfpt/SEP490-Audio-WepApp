import React, { useState, useEffect } from 'react';
import { ProductListService } from '../../services/customer/ProductListService';
import type { Product } from '../../services/customer/ProductListService';
import LoadingSkeleton from '../common/LoadingSkeleton';

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load featured products
  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProductListService.getFeaturedProducts(8);
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Error loading featured products:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải sản phẩm nổi bật');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} type="custom" height="300px" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm nổi bật</h2>
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-medium mb-2">Có lỗi xảy ra</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={loadFeaturedProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm nổi bật</h2>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg font-medium mb-2">Chưa có sản phẩm nổi bật</div>
          <div className="text-gray-400">Hãy quay lại sau để xem các sản phẩm mới</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          Xem tất cả →
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.productId} className="group cursor-pointer">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
              {/* Product Image */}
              <div className="aspect-square bg-gray-200 relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Featured Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                    Nổi bật
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ProductListService.getStatusColor(product.status)}`}>
                    {ProductListService.getStatusLabel(product.status)}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Category & Brand */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{product.categoryName}</span>
                  <span className="text-xs text-blue-600 font-medium">{product.brandName}</span>
                </div>
                
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                
                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-red-600">
                      {ProductListService.formatPrice(product.finalPrice, product.currency)}
                    </span>
                    {product.discountPrice && product.discountPrice !== product.finalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {ProductListService.formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </div>
                  {product.stockQuantity > 0 && (
                    <span className="text-xs text-green-600">Còn {product.stockQuantity}</span>
                  )}
                </div>

                {/* Key Specs */}
                <div className="space-y-1 mb-3">
                  {product.frequencyResponse && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Dải tần:</span> {product.frequencyResponse}
                    </div>
                  )}
                  {product.powerHandling && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Công suất:</span> {product.powerHandling}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;
