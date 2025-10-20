import React, { useState, useEffect } from 'react';
import { ProductListService } from '../../services/customer/ProductListService';
import type { Product, ProductListParams } from '../../services/customer/ProductListService';
import LoadingSkeleton from '../common/LoadingSkeleton';

interface ProductListProps {
  title?: string;
  params?: ProductListParams;
  showFilters?: boolean;
  className?: string;
}

const ProductList: React.FC<ProductListProps> = ({ 
  title = "Danh sách sản phẩm", 
  params = {},
  showFilters = false,
  className = ""
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    categoryName: '',
    keyword: '',
    status: 'ACTIVE'
  });

  // Load products
  const loadProducts = async (searchParams: ProductListParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProductListService.getProducts({
        ...params,
        ...searchParams,
        page: 0,
        size: 20
      });
      
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(filters);
  };

  // Product card component
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-gray-200 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ProductListService.getStatusColor(product.status)}`}>
            {ProductListService.getStatusLabel(product.status)}
          </span>
        </div>

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
              Nổi bật
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-gray-500 mb-1">{product.categoryName}</div>
        
        {/* Brand */}
        <div className="text-sm text-blue-600 font-medium mb-1">{product.brandName}</div>
        
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        {/* Short Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
        
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
            <span className="text-xs text-green-600">Còn {product.stockQuantity} sản phẩm</span>
          )}
        </div>

        {/* Technical Specs Preview */}
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
          {product.connectionType && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Kết nối:</span> {product.connectionType}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Xem chi tiết
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={className}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <LoadingSkeleton type="custom" height="40px" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <LoadingSkeleton key={index} type="custom" height="400px" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-2">Có lỗi xảy ra</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => loadProducts()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        
        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  placeholder="Nhập tên sản phẩm, thương hiệu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={filters.categoryName}
                  onChange={(e) => handleFilterChange('categoryName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  <option value="Loa">Loa</option>
                  <option value="Tai Nghe">Tai Nghe</option>
                  <option value="Micro">Micro</option>
                  <option value="Amp">Amp</option>
                  <option value="DAC">DAC</option>
                  <option value="Mixer">Mixer</option>
                  <option value="Turntable">Turntable</option>
                </select>
              </div>
              
              <div className="min-w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Đang bán</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg font-medium mb-2">Không tìm thấy sản phẩm</div>
          <div className="text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
