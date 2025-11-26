import React from 'react';

interface ProductListGridProps {
  products: any[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
}

export const ProductListGrid: React.FC<ProductListGridProps> = ({
  products,
  viewMode,
  loading = false,
}) => {
  if (loading) {
    return <div className="text-center py-8">Đang tải sản phẩm...</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-8 text-gray-500">Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
      {products.map((product) => {
        const key = product.id || product.productId;
        const firstImage =
          product.image ||
          product.thumbnail ||
          (Array.isArray(product.images) ? product.images[0] : undefined);
        const isVariantProduct = Array.isArray(product.variants) && product.variants.length > 0;
        const price = isVariantProduct
          ? product.variants[0]?.variantPrice
          : product.finalPrice ?? product.price;

        return (
          <div key={key} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="w-full h-48 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
              {firstImage ? (
                <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-sm">Không có hình ảnh</div>
              )}
            </div>
            <h3 className="mt-2 font-semibold line-clamp-2">{product.name}</h3>
            <p className="text-orange-600 font-bold mt-1">
              {price ? price.toLocaleString('vi-VN') : '0'}đ
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ProductListGrid;
