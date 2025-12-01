import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductListGridProps {
  products: any[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  selectedProductIds?: string[];
  onToggleCompare?: (product: any) => void;
}

export const ProductListGrid: React.FC<ProductListGridProps> = ({
  products,
  viewMode,
  loading = false,
  selectedProductIds = [],
  onToggleCompare,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center py-8">Đang tải sản phẩm...</div>;
  }

  if (products.length === 0 && !loading) {
    return <div className="text-center py-8 text-gray-500">Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
      {products.map((product) => {
        const productId = product.productId || product.id;
        const key = productId;
        const firstImage =
          product.image ||
          product.thumbnail ||
          (Array.isArray(product.images) ? product.images[0] : undefined);
        const isVariantProduct = Array.isArray(product.variants) && product.variants.length > 0;
        const price = isVariantProduct
          ? product.variants[0]?.variantPrice
          : product.finalPrice ?? product.price;
        const isSelected = selectedProductIds.includes(productId);

        const handleCardClick = () => {
          if (!productId) return;
          navigate(`/product/${productId}`);
        };

        return (
          <div
            key={key}
            onClick={handleCardClick}
            className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer ${
              isSelected ? 'ring-2 ring-orange-400' : ''
            }`}
          >
            <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm">Không có hình ảnh</div>
              )}
            </div>

            <div className="flex-1 flex flex-col mt-3">
              <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                {product.name}
              </h3>
              <p className="text-orange-600 font-bold mt-2">
                {price ? price.toLocaleString('vi-VN') : '0'}đ
              </p>

              {onToggleCompare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(product);
                  }}
                  className={`mt-auto w-full border rounded-full py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-orange-500 text-orange-600 bg-orange-50'
                      : 'border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {isSelected ? 'Đã chọn để so sánh' : 'So sánh sản phẩm'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductListGrid;
