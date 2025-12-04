import React from 'react';
import ProductReviewSection from '../reviewproduct/ProductReviewSection';

interface ProductTabsProps {
  description?: string[] | string;
  specs: Array<{ key: string; value: string }>;
  productId?: string;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ description = [], specs, productId }) => {
  return (
    <div className="mt-6 space-y-4">
      {/* Thông số kỹ thuật */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thông số kỹ thuật</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3">
            {specs.map((s, idx) => (
              <div key={idx} className="flex items-start py-2 border-b last:border-0 border-gray-100">
                <div className="w-48 text-gray-600 text-sm">{s.key}</div>
                <div className="flex-1 font-medium text-gray-900 text-sm">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mô tả sản phẩm</h3>
        </div>
        <div className="p-4">
          <div className="text-gray-700 leading-relaxed">
            {!description || (Array.isArray(description) && description.length === 0) ? (
              <p className="text-gray-500">Đang cập nhật mô tả...</p>
            ) : typeof description === 'string' ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <div className="space-y-3">
                {description.map((p, i) => (
                  <div 
                    key={i}
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: p }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Đánh giá */}
      <ProductReviewSection productId={productId} />
    </div>
  );
};

export default ProductTabs;


