import React from 'react';
import SectionCard from './SectionCard';
import { TinyMCEEditor } from '../common';

interface FormState {
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
  connectionType: string;
  voltageInput: string;
}

interface Category {
  categoryId: string;
  name: string;
}

interface BasicInfoSectionProps {
  form: FormState;
  categories: Category[];
  categoriesLoading: boolean;
  getDimensionParts: { l: string; w: string; h: string };
  touchedFields?: Record<string, boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onDescriptionChange: (content: string) => void;
  onDimensionChange: (part: 'l' | 'w' | 'h', value: string) => void;
  onBlur?: (fieldName: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  categories,
  categoriesLoading,
  getDimensionParts,
  touchedFields = {},
  onChange,
  onDescriptionChange,
  onDimensionChange,
  onBlur,
}) => {
  return (
    <SectionCard title="Thông tin chung" description="Nhập thông tin cơ bản cho sản phẩm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-500">* </span>Tên sản phẩm
          </label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            onBlur={() => onBlur?.('name')}
            type="text"
            maxLength={100}
            placeholder="VD: Sony WH-1000XM4"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs">
              {touchedFields.name && !form.name.trim() && (
                <span className="text-red-600">Vui lòng nhập tên sản phẩm</span>
              )}
              {touchedFields.name && form.name.trim() && form.name.trim().length < 10 && (
                <span className="text-red-600">
                  Tên sản phẩm của bạn quá ngắn. Vui lòng nhập ít nhất 10 ký tự.
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{form.name.length}/100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
          <input
            name="shortDescription"
            value={form.shortDescription}
            onChange={onChange}
            type="text"
            placeholder="Tóm tắt 1-2 câu về sản phẩm"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-500">* </span>Mô tả chi tiết
          </label>
          <div className="mt-1">
            <TinyMCEEditor
              value={form.description}
              onChange={onDescriptionChange}
              placeholder="Mô tả đầy đủ về sản phẩm, tính năng, chất lượng..."
              height={400}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="text-red-500">* </span>Thương hiệu
            </label>
            <input
              name="brandName"
              value={form.brandName}
              onChange={onChange}
              type="text"
              placeholder="VD: Sony, Sennheiser, JBL"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <span className="text-red-500">* </span>Danh mục
            </label>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              disabled={categoriesLoading}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {categoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục'}
              </option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã model</label>
            <input
              name="model"
              value={form.model}
              onChange={onChange}
              type="text"
              placeholder="VD: WH1000XM4"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
            <input
              name="material"
              value={form.material}
              onChange={onChange}
              type="text"
              placeholder="VD: Nhựa ABS, Nhôm, Da"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kích thước (mm)</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <input
                value={getDimensionParts.l}
                onChange={(e) => onDimensionChange('l', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Dài (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              <input
                value={getDimensionParts.w}
                onChange={(e) => onDimensionChange('w', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Rộng (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              <input
                value={getDimensionParts.h}
                onChange={(e) => onDimensionChange('h', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Cao (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-500">* </span>Trọng lượng (kg)
          </label>
          <input
            name="weight"
            value={form.weight}
            onChange={onChange}
            onKeyDown={(e) => {
              // Chặn các ký tự không phải số, dấu chấm, dấu phẩy, backspace, delete, arrow keys
              if (
                !/[0-9.,]/.test(e.key) &&
                e.key !== 'Backspace' &&
                e.key !== 'Delete' &&
                e.key !== 'ArrowLeft' &&
                e.key !== 'ArrowRight' &&
                e.key !== 'Tab'
              ) {
                e.preventDefault();
              }
            }}
            type="text"
            inputMode="decimal"
            placeholder="VD: 0.25"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kết nối</label>
            <input
              name="connectionType"
              value={form.connectionType}
              onChange={onChange}
              type="text"
              placeholder="VD: Bluetooth, RCA, USB"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Điện áp</label>
            <input
              name="voltageInput"
              value={form.voltageInput}
              onChange={onChange}
              type="text"
              placeholder="VD: 5V"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default BasicInfoSection;
