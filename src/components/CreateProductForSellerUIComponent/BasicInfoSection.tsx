import React from 'react';
import SectionCard from './SectionCard';

export interface BasicInfoValues {
  name: string;
  brand: string;
  category: 'Headphone' | 'Earbud' | 'Speaker' | 'DAC/Amp' | 'Microphone' | 'Accessory';
  price: string;
  discountPrice: string;
  stock: string;
  sku: string;
  warrantyMonths: string;
  colors: string;
}

interface BasicInfoSectionProps {
  values: BasicInfoValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ values, onChange }) => {
  return (
    <SectionCard title="Thông tin cơ bản" description="Tên, thương hiệu, danh mục, giá...">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
          <input name="name" value={values.name} onChange={onChange} type="text" placeholder="VD: Tai nghe over-ear Hi-Fi" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Thương hiệu *</label>
            <input name="brand" value={values.brand} onChange={onChange} type="text" placeholder="VD: Sennheiser, Sony, FiiO" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Danh mục *</label>
            <select name="category" value={values.category} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
              <option>Headphone</option>
              <option>Earbud</option>
              <option>Speaker</option>
              <option>DAC/Amp</option>
              <option>Microphone</option>
              <option>Accessory</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá (VND) *</label>
            <input name="price" value={values.price} onChange={onChange} type="number" min={0} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá khuyến mãi</label>
            <input name="discountPrice" value={values.discountPrice} onChange={onChange} type="number" min={0} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tồn kho</label>
            <input name="stock" value={values.stock} onChange={onChange} type="number" min={0} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU</label>
            <input name="sku" value={values.sku} onChange={onChange} type="text" placeholder="Mã sản phẩm" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bảo hành (tháng)</label>
            <input name="warrantyMonths" value={values.warrantyMonths} onChange={onChange} type="number" min={0} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Màu sắc (phân tách bằng dấu phẩy)</label>
            <input name="colors" value={values.colors} onChange={onChange} type="text" placeholder="Đen, Bạc, Xanh..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default BasicInfoSection;


