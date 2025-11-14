import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerCategoryService } from '../../services/customer/CategoryService';
import type { CategoryItem } from '../../types/api';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await CustomerCategoryService.getAllCategories();
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?categoryName=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
      </div>

      {/* Categories */}
      <div className="py-2">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm">Đang tải danh mục...</p>
          </div>
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.categoryId}>
              {/* Main category */}
              <button
                onClick={() => handleCategoryClick(category.name)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700 font-medium">{category.name}</span>
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p className="text-sm">Không có danh mục</p>
          </div>
        )}
      </div>

     
    </div>
  );
};

export default Sidebar;