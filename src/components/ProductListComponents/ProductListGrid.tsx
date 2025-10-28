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
      {products.map((product) => (
        <div key={product.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded" />
          <h3 className="mt-2 font-semibold line-clamp-2">{product.name}</h3>
          <p className="text-orange-600 font-bold mt-1">{product.price?.toLocaleString('vi-VN')}đ</p>
        </div>
      ))}
    </div>
  );
};

export default ProductListGrid;
