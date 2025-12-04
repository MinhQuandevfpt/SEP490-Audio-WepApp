import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { PolicyService } from '../../services/admin/PolicyService';
import type { PolicyCategory, PolicyItem } from '../../types/policy';

const PolicyCategoryDetailPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<PolicyCategory | null>(null);
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PolicyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryDetail();
    }
  }, [categoryId]);

  const fetchCategoryDetail = async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const categoryResponse = await PolicyService.getCategoryById(categoryId);
      
      setCategory(categoryResponse.data);
      // API trả về policyItems trong category response
      const activeItems = categoryResponse.data.policyItems?.filter(item => item.isActive) || [];
      setItems(activeItems);
      
      // Check if there's an itemTitle in query params
      const itemTitle = searchParams.get('item');
      
      if (itemTitle && activeItems.length > 0) {
        // Find item by title (case-insensitive, partial match)
        const foundItem = activeItems.find(item => 
          item.title.toLowerCase().includes(itemTitle.toLowerCase())
        );
        if (foundItem) {
          setSelectedItem(foundItem);
        } else {
          // If not found, select first item
          setSelectedItem(activeItems[0]);
        }
      } else if (activeItems.length > 0) {
        // Auto select first item if no query param
        setSelectedItem(activeItems[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching category detail:', err);
      setError('Không thể tải thông tin chính sách. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-20 px-4">
          <div className="bg-white border border-red-200 rounded-lg p-6 text-center space-y-4">
            <p className="text-red-600 font-medium">{error || 'Không tìm thấy danh mục'}</p>
            <Link
              to="/policies"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/policies"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          
          <div className="flex items-start gap-4">
            {category.iconUrl && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <img
                  src={category.iconUrl}
                  alt={category.name}
                  className="w-10 h-10 object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {items.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">Chưa có bài viết nào trong danh mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Items List */}
              <div className="col-span-12 lg:col-span-4">
                <div className="sticky top-6 space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 px-3">Danh sách bài viết</h2>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                        selectedItem?.id === item.id
                          ? 'bg-orange-50 border-2 border-orange-500 shadow-sm'
                          : 'bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-sm'
                      }`}
                    >
                      <h3 className={`font-semibold mb-1 ${
                        selectedItem?.id === item.id ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </h3>
                      <div className="text-xs text-gray-500">
                        Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Content - Selected Item Detail */}
              <div className="col-span-12 lg:col-span-8">
                {selectedItem ? (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h2>
                      <div className="mt-2 text-sm text-gray-500">
                        Ngày tạo: {new Date(selectedItem.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="p-6">
                      <div 
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                    <p className="text-gray-600">Chọn một bài viết để xem nội dung</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2022 AudioShop. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PolicyCategoryDetailPage;
