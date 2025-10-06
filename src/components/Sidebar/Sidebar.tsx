import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { categories } from '../../data/categories';

const Sidebar: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
      </div>

      {/* Categories */}
      <div className="py-2">
        {categories.map((category) => (
          <div key={category.id}>
            {/* Main category */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{category.icon}</span>
                <span className="text-gray-700 font-medium">{category.name}</span>
              </div>
              {category.subcategories && (
                expandedCategory === category.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )
              )}
            </button>

            {/* Subcategories */}
            {category.subcategories && expandedCategory === category.id && (
              <div className="bg-gray-50 border-t border-gray-100">
                {category.subcategories.map((subcategory, index) => (
                  <a
                    key={index}
                    href={`/${category.id}/${subcategory.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block px-8 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-100 transition-colors"
                  >
                    {subcategory}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Promotion banner in sidebar */}
      <div className="m-4 p-4 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg text-white">
        <h4 className="font-bold text-sm mb-1">Ưu đãi đặc biệt</h4>
        <p className="text-xs mb-2">Giảm 20% cho đơn hàng đầu tiên</p>
        <button className="bg-white text-orange-500 text-xs px-3 py-1 rounded-full font-medium">
          Xem ngay
        </button>
      </div>
    </div>
  );
};

export default Sidebar;