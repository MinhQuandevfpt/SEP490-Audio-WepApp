import React from 'react';

interface ProductTabsProps {
  description?: string[] | string;
  specs: Array<{ key: string; value: string }>;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ description = [], specs }) => {
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá sản phẩm</h3>
        </div>
        <div className="p-4">
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="font-medium">Chưa có đánh giá nào</p>
            <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTabs;


