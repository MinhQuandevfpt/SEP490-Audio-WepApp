import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerCategoryService } from '../../services/customer/CategoryService';
import type { CategoryTreeNode } from '../../types/api';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarProps {
  hideHeader?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await CustomerCategoryService.getCategoryTree();
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

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: CategoryTreeNode, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.categoryId);
    const paddingLeft = level > 0 ? `${level * 16 + 16}px` : '0px';

    return (
      <div key={category.categoryId}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleCategory(category.categoryId)}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}
          <button
            onClick={() => handleCategoryClick(category.name)}
            className="flex-1 flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            style={{ paddingLeft: paddingLeft !== '0px' ? paddingLeft : undefined }}
          >
            <span className={`text-gray-700 ${level > 0 ? 'font-normal text-sm' : 'font-medium'}`}>
              {category.name}
            </span>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-64 bg-white ${hideHeader ? '' : 'border border-gray-200 rounded-lg shadow-sm'} max-h-screen overflow-y-auto`}>
      {/* Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
        </div>
      )}

      {/* Categories */}
      <div className="py-2">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm">Đang tải danh mục...</p>
          </div>
        ) : categories.length > 0 ? (
          categories.map((category) => renderCategory(category))
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