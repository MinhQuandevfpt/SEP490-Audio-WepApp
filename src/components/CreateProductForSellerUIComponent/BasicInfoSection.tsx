import React from 'react';
import SectionCard from './SectionCard';
import type { Category, ShippingMethod } from '../../types/seller';

// Utility function to format numbers with dots for thousands separators
const formatNumber = (value: string): string => {
  // Remove all non-numeric characters except dots
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Add dots every 3 digits from the right
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Utility function to parse formatted number back to numeric string
const parseFormattedNumber = (formattedValue: string): string => {
  return formattedValue.replace(/\./g, '');
};

export interface BasicInfoValues {
  // Basic Product Info
  name: string;
  brandName: string;
  category: string;
  shortDescription: string;
  description: string;
  model: string;
  color: string;
  material: string;
  dimensions: string;
  weight: string;
  
  // Pricing & Inventory
  price: string;
  discountPrice: string;
  currency: string;
  stockQuantity: string;
  sku: string;
  
  // Warranty & Manufacturer
  warrantyPeriod: string;
  warrantyType: string;
  manufacturerName: string;
  manufacturerAddress: string;
  productCondition: string;
  isCustomMade: string;
  
  // Warehouse & Shipping
  warehouseLocation: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  shippingAddress: string;
  shippingFee: string;
  selectedShippingMethodIds: string[]; // array of selected shipping method IDs
  
  // Media
  videoUrl: string;
}

interface BasicInfoSectionProps {
  values: BasicInfoValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onShippingMethodChange?: (selectedIds: string[]) => void; // For handling shipping method selection
  categories?: Category[]; // Add categories prop
  shippingMethods?: ShippingMethod[]; // Add shipping methods prop
  loading?: boolean; // Add loading state
  shippingMethodsLoading?: boolean; // Add shipping methods loading state
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ 
  values, 
  onChange, 
  onShippingMethodChange,
  categories = [], 
  shippingMethods = [],
  loading = false,
  shippingMethodsLoading = false 
}) => {
  return (
    <SectionCard title="Thông tin cơ bản" description="Thông tin chung của sản phẩm">
      <div className="space-y-6">
        {/* Basic Product Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin sản phẩm</h3>
          
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
            <input name="name" value={values.name} onChange={onChange} type="text" placeholder="VD: Sony WH-1000XM4" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả ngắn *</label>
            <input name="shortDescription" value={values.shortDescription} onChange={onChange} type="text" placeholder="Tóm tắt 1-2 câu về sản phẩm" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
            <textarea name="description" value={values.description} onChange={onChange} rows={4} placeholder="Mô tả đầy đủ về sản phẩm, tính năng, chất lượng..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Thương hiệu *</label>
              <input name="brandName" value={values.brandName} onChange={onChange} type="text" placeholder="VD: Sony, Sennheiser, JBL" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Danh mục *</label>
              <select 
                name="category" 
                value={values.category} 
                onChange={onChange} 
                disabled={loading}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading ? 'Đang tải danh mục...' : 'Chọn danh mục'}
                </option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="mt-1 text-xs text-gray-500">Đang tải danh sách danh mục...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã model</label>
              <input name="model" value={values.model} onChange={onChange} type="text" placeholder="VD: WH1000XM4" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
              <input name="color" value={values.color} onChange={onChange} type="text" placeholder="VD: Đen, Bạc, Xanh" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
              <input name="material" value={values.material} onChange={onChange} type="text" placeholder="VD: Nhựa ABS, Nhôm, Da" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kích thước</label>
              <input name="dimensions" value={values.dimensions} onChange={onChange} type="text" placeholder="VD: 20 x 15 x 8 cm" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Trọng lượng (kg)</label>
            <input name="weight" value={values.weight} onChange={onChange} type="number" step="0.1" min="0" placeholder="VD: 0.25" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Giá cả & Tồn kho</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá gốc (VND) *</label>
              <input 
                name="price" 
                value={formatNumber(values.price)} 
                onChange={(e) => {
                  const formattedValue = formatNumber(e.target.value);
                  const numericValue = parseFormattedNumber(formattedValue);
                  onChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: 'price',
                      value: numericValue
                    }
                  });
                }}
                type="text" 
                placeholder="VD: 5.000.000" 
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá khuyến mãi (VND)</label>
              <input 
                name="discountPrice" 
                value={formatNumber(values.discountPrice)} 
                onChange={(e) => {
                  const formattedValue = formatNumber(e.target.value);
                  const numericValue = parseFormattedNumber(formattedValue);
                  onChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: 'discountPrice',
                      value: numericValue
                    }
                  });
                }}
                type="text" 
                placeholder="VD: 4.500.000" 
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng tồn *</label>
              <input name="stockQuantity" value={values.stockQuantity} onChange={onChange} type="number" min="0" placeholder="VD: 50" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU *</label>
              <input name="sku" value={values.sku} onChange={onChange} type="text" placeholder="VD: SONY-WH1000XM4-BLK" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đơn vị tiền tệ</label>
              <select name="currency" value={values.currency} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warranty & Manufacturer */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Bảo hành & Nhà sản xuất</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Thời gian bảo hành</label>
              <input name="warrantyPeriod" value={values.warrantyPeriod} onChange={onChange} type="text" placeholder="VD: 12 tháng" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại bảo hành</label>
              <select name="warrantyType" value={values.warrantyType} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
                <option value="">Chọn loại bảo hành</option>
                <option value="Chính hãng">Chính hãng</option>
                <option value="1 đổi 1">1 đổi 1</option>
                <option value="Sửa chữa">Sửa chữa</option>
            </select>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium text-gray-700">Tên nhà sản xuất</label>
              <input name="manufacturerName" value={values.manufacturerName} onChange={onChange} type="text" placeholder="VD: Sony Corporation" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ nhà sản xuất</label>
              <input name="manufacturerAddress" value={values.manufacturerAddress} onChange={onChange} type="text" placeholder="VD: Tokyo, Japan" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tình trạng sản phẩm</label>
              <select name="productCondition" value={values.productCondition} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
                <option value="">Chọn tình trạng</option>
                <option value="Mới 100%">Mới 100%</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div className="flex items-center">
              <input name="isCustomMade" type="checkbox" checked={values.isCustomMade === 'true'} onChange={(e) => onChange({...e, target: {...e.target, name: 'isCustomMade', value: e.target.checked.toString()}})} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-700">Làm theo yêu cầu</label>
            </div>
          </div>
        </div>

        {/* Warehouse & Shipping */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Kho hàng & Vận chuyển</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ kho</label>
              <input name="warehouseLocation" value={values.warehouseLocation} onChange={onChange} type="text" placeholder="VD: Hà Nội - Ba Đình" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Phí vận chuyển (VND)</label>
              <input 
                name="shippingFee" 
                value={formatNumber(values.shippingFee)} 
                onChange={(e) => {
                  const formattedValue = formatNumber(e.target.value);
                  const numericValue = parseFormattedNumber(formattedValue);
                  onChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: 'shippingFee',
                      value: numericValue
                    }
                  });
                }}
                type="text" 
                placeholder="VD: 30.000" 
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
              />
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã Tỉnh</label>
              <input name="provinceCode" value={values.provinceCode} onChange={onChange} type="text" placeholder="VD: 01" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Mã Quận</label>
              <input name="districtCode" value={values.districtCode} onChange={onChange} type="text" placeholder="VD: 001" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Mã Phường</label>
              <input name="wardCode" value={values.wardCode} onChange={onChange} type="text" placeholder="VD: 00001" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ giao</label>
              <input name="shippingAddress" value={values.shippingAddress} onChange={onChange} type="text" placeholder="Địa chỉ giao hàng" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức vận chuyển</label>
            
            {shippingMethodsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Đang tải phương thức vận chuyển...</span>
              </div>
            ) : shippingMethods.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Không có phương thức vận chuyển nào
              </div>
            ) : (
              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const isSelected = values.selectedShippingMethodIds.includes(method.shippingMethodId);
                  return (
                    <div
                      key={method.shippingMethodId}
                      className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        const newSelectedIds = isSelected
                          ? values.selectedShippingMethodIds.filter(id => id !== method.shippingMethodId)
                          : [...values.selectedShippingMethodIds, method.shippingMethodId];
                        onShippingMethodChange?.(newSelectedIds);
                      }}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div onClick
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {method.logoUrl && (
                              <img
                                src={method.logoUrl}
                                alt={method.name}
                                className="h-8 w-8 object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{method.name}</h3>
                              <p className="text-xs text-gray-500">{method.description || 'Phương thức vận chuyển'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {method.supportCOD && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                COD
                              </span>
                            )}
                            {method.supportInsurance && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Bảo hiểm
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            {method.baseFee > 0 && (
                              <span>Phí cơ bản: {method.baseFee.toLocaleString('vi-VN')} VND</span>
                            )}
                            {method.feePerKg > 0 && (
                              <span>Phí/kg: {method.feePerKg.toLocaleString('vi-VN')} VND</span>
                            )}
                          </div>
                          {method.estimatedDeliveryDays > 0 && (
                            <span>Giao hàng: {method.estimatedDeliveryDays} ngày</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {values.selectedShippingMethodIds.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Đã chọn {values.selectedShippingMethodIds.length} phương thức vận chuyển:
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.selectedShippingMethodIds.map((id) => {
                    const method = shippingMethods.find(m => m.shippingMethodId === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {method?.name || id}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newSelectedIds = values.selectedShippingMethodIds.filter(selectedId => selectedId !== id);
                            onShippingMethodChange?.(newSelectedIds);
                          }}
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Media</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Video URL</label>
            <input name="videoUrl" value={values.videoUrl} onChange={onChange} type="url" placeholder="VD: https://youtube.com/watch?v=abc123" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default BasicInfoSection;


