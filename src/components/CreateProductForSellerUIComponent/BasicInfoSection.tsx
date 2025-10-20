import React, { useState, useEffect } from 'react';
import SectionCard from './SectionCard';
import { CategoryService } from '../../services/category/CategoryService';
import type { Category } from '../../services/category/CategoryService';

export interface BasicInfoValues {
  // Basic info
  name: string;
  brandName: string;
  categoryId: string; // categoryId từ API
  categoryName: string; // tên category để hiển thị
  sku: string;
  shortDescription: string;
  description: string;
  model: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  
  // Pricing
  price: string;
  discountPrice: string;
  currency: string;
  stockQuantity: string;
  
  // Location & Shipping
  warehouseLocation: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  shippingAddress: string;
  shippingFee: string;
  
  // Warranty
  warrantyPeriod: string;
  warrantyType: string;
  
  // Manufacturer
  manufacturerName: string;
  manufacturerAddress: string;
  productCondition: string;
  isCustomMade: boolean;
  
  // Video
  videoUrl: string;
}

interface BasicInfoSectionProps {
  values: BasicInfoValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ values, onChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Load categories khi component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      setCategoriesError(null);
      
      const response = await CategoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoriesError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh mục');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = e.target.value;
    const selectedCategory = categories.find(cat => cat.categoryId === selectedCategoryId);
    
    // Tạo event object mới với cả categoryId và categoryName
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'categoryId',
        value: selectedCategoryId
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
    
    onChange(syntheticEvent);
    
    // Cập nhật categoryName riêng biệt
    if (selectedCategory) {
      const categoryNameEvent = {
        ...e,
        target: {
          ...e.target,
          name: 'categoryName',
          value: selectedCategory.name
        }
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
      onChange(categoryNameEvent);
    }
  };

  return (
    <SectionCard title="Thông tin cơ bản" description="Tên, thương hiệu, danh mục, giá...">
      <div className="space-y-6">
        {/* Tên sản phẩm và Mô tả ngắn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
            <input 
              name="name" 
              value={values.name} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: Sony WH-1000XM4" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả ngắn *</label>
            <input 
              name="shortDescription" 
              value={values.shortDescription} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: Tai nghe chống ồn hàng đầu" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Thương hiệu và Danh mục */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Thương hiệu *</label>
            <input 
              name="brandName" 
              value={values.brandName} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: Sony, Sennheiser, JBL" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Danh mục *</label>
            <select 
              name="categoryId" 
              value={values.categoryId} 
              onChange={handleCategoryChange} 
              disabled={isLoadingCategories}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'}
              </option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Error message cho categories */}
            {categoriesError && (
              <p className="mt-1 text-sm text-red-600">
                {categoriesError}
              </p>
            )}
          </div>
        </div>

        {/* SKU và Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU *</label>
            <input 
              name="sku" 
              value={values.sku} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: SONY-WH1000XM4-BLK" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <input 
              name="model" 
              value={values.model} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: WH-1000XM4" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Màu sắc và Chất liệu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
            <input 
              name="color" 
              value={values.color} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: Đen, Bạc, Xanh" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
            <input 
              name="material" 
              value={values.material} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: Nhựa ABS, Nhôm, Da" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Kích thước và Trọng lượng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kích thước (DxRxC)</label>
            <input 
              name="dimensions" 
              value={values.dimensions} 
              onChange={onChange} 
              type="text" 
              placeholder="VD: 24cm x 10cm x 12cm" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trọng lượng (kg)</label>
            <input 
              name="weight" 
              value={values.weight} 
              onChange={onChange} 
              type="number" 
              step="0.1"
              placeholder="VD: 1.2" 
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Giá cả */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá (VND) *</label>
            <input 
              name="price" 
              value={values.price} 
              onChange={onChange} 
              type="number" 
              min={0} 
              placeholder="3500000"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá khuyến mãi</label>
            <input 
              name="discountPrice" 
              value={values.discountPrice} 
              onChange={onChange} 
              type="number" 
              min={0} 
              placeholder="2990000"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tồn kho *</label>
            <input 
              name="stockQuantity" 
              value={values.stockQuantity} 
              onChange={onChange} 
              type="number" 
              min={0} 
              placeholder="50"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
          <textarea 
            name="description" 
            value={values.description} 
            onChange={onChange} 
            rows={4}
            placeholder="Mô tả chi tiết về sản phẩm, tính năng, ưu điểm..."
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
          />
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Video Demo (URL)</label>
          <input 
            name="videoUrl" 
            value={values.videoUrl} 
            onChange={onChange} 
            type="url" 
            placeholder="https://youtube.com/watch?v=abc123" 
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default BasicInfoSection;


