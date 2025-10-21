import React from 'react';
import type { Product } from '../../services/customer/ProductListService';
import ProductCard from '../ProductCard/ProductCard';
import ProductListSkeleton from './ProductListSkeleton';

interface ProductListGridProps {
  products: Product[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
}

const ProductListGrid: React.FC<ProductListGridProps> = ({
  products,
  loading = false,
  viewMode = 'grid',
}) => {
  // Convert API product to ProductCard format
  const convertToProductCardFormat = (product: Product) => {
    return {
      id: product.productId,
      name: product.name,
      brand: product.brandName,
      price: product.finalPrice,
      originalPrice: product.price,
      discount: product.promotionPercent || undefined,
      image: product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/300x300?text=No+Image',
      rating: product.ratingAverage || 0,
      reviewCount: product.reviewCount || 0,
      soldCount: 0, // API doesn't provide this field
      inStock: product.stockQuantity > 0,
      stockQuantity: product.stockQuantity,
      category: product.categoryName,
      storeName: product.storeName,
      status: product.status,
      isFeatured: product.isFeatured,
    };
  };

  if (loading) {
    return <ProductListSkeleton count={12} viewMode={viewMode} />;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
        <p className="text-gray-500 mb-4">
          Không có sản phẩm nào phù hợp với bộ lọc của bạn. Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm khác.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Làm mới trang
        </button>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
        : 'grid-cols-1'
    }`}>
      {products.map((product) => (
        <ProductCard
          key={product.productId}
          product={convertToProductCardFormat(product)}
        />
      ))}
    </div>
  );
};

export default ProductListGrid;
