import React from 'react';

interface ProductTabsProps {
  description?: string[] | string;
  specs: Array<{ key: string; value: string }>;
}

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      active ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

const ProductTabs: React.FC<ProductTabsProps> = ({ description = [], specs }) => {
  const [active, setActive] = React.useState<'desc' | 'specs' | 'reviews'>('desc');
  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <TabButton label="Mô tả sản phẩm" active={active === 'desc'} onClick={() => setActive('desc')} />
        <TabButton label="Thông số kỹ thuật" active={active === 'specs'} onClick={() => setActive('specs')} />
        <TabButton label="Đánh giá" active={active === 'reviews'} onClick={() => setActive('reviews')} />
      </div>
      <div className="mt-3 bg-white rounded-2xl shadow-md p-4">
        {active === 'desc' && (
          <div className="text-gray-700 leading-relaxed">
            {!description || (Array.isArray(description) && description.length === 0) ? (
              <p>Đang cập nhật mô tả...</p>
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
        )}
        {active === 'specs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {specs.map((s, idx) => (
              <div key={idx} className="flex items-start py-2 border-b last:border-0 border-gray-100">
                <div className="w-40 text-gray-500">{s.key}</div>
                <div className="flex-1 font-medium text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {active === 'reviews' && (
          <div className="text-gray-700">Chức năng đánh giá sẽ được cập nhật.</div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;


