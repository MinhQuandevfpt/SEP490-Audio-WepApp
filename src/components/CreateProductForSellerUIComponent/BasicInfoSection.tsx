import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from './SectionCard';
import { TinyMCEEditor } from '../common';

interface FormState {
  name: string;
  brandName: string;
  categoryIds: string[];
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
  children?: Category[];
}

interface BasicInfoSectionProps {
  form: FormState;
  categories: Category[];
  categoriesLoading: boolean;
  getDimensionParts: { l: string; w: string; h: string };
  touchedFields?: Record<string, boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCategoryChange: (ids: string[]) => void;
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
  onCategoryChange,
  onDescriptionChange,
  onDimensionChange,
  onBlur,
}) => {
  // Giữ lựa chọn tạm thời trên dropdown, chỉ áp dụng khi bấm "Áp dụng"
  const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>(form.categoryIds || []);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  useEffect(() => {
    setPendingCategoryIds(form.categoryIds || []);
  }, [form.categoryIds]);

  const findCategoryNameById = (id: string): string => {
    const stack = [...categories];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (current.categoryId === id) return current.name;
      if (current.children) stack.push(...current.children);
    }
    return '';
  };

  const appliedCategoryNames = useMemo(
    () => (form.categoryIds || []).map(findCategoryNameById).filter(Boolean),
    [form.categoryIds, categories]
  );

  const toggleCategory = (id: string) => {
    setPendingCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const renderCategoryCheckboxes = (list: Category[], level = 0): React.ReactNode[] => {
    const items: React.ReactNode[] = [];
    list.forEach((cat) => {
      items.push(
        <div key={cat.categoryId} className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id={`cat-${cat.categoryId}`}
            checked={pendingCategoryIds.includes(cat.categoryId)}
            onChange={() => toggleCategory(cat.categoryId)}
            className="h-4 w-4 text-orange-600 border-gray-300 rounded"
          />
          <label
            htmlFor={`cat-${cat.categoryId}`}
            className="text-sm text-gray-700"
            style={{ paddingLeft: level * 12 }}
          >
            {cat.name}
          </label>
        </div>
      );
      if (cat.children && cat.children.length > 0) {
        items.push(...renderCategoryCheckboxes(cat.children, level + 1));
      }
    });
    return items;
  };

  // Giới hạn kích thước từng cạnh trong khoảng 0 - 1200 mm
  const handleDimensionInputChange = (part: 'l' | 'w' | 'h', raw: string) => {
    // Cho phép rỗng để user xoá nhập lại
    if (raw.trim() === '') {
      onDimensionChange(part, '');
      return;
    }

    // Chỉ giữ lại chữ số
    const numeric = raw.replace(/[^\d]/g, '');
    if (!numeric) {
      onDimensionChange(part, '');
      return;
    }

    const value = Number(numeric);
    if (Number.isNaN(value)) {
      return;
    }

    // Không cho nhập quá 1200 mm
    if (value > 1200) {
      return;
    }

    onDimensionChange(part, numeric);
  };

  // Chỉ cho phép trọng lượng trong khoảng (0 - 90] kg
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Cho phép rỗng để user xoá nhập lại
    if (raw.trim() === '') {
      setWeightError(null);
      onChange(e);
      return;
    }

    // Chuẩn hoá: thay dấu phẩy thành chấm trước khi parse
    const normalized = raw.replace(',', '.');
    const value = Number(normalized);

    // Nếu không phải số hợp lệ thì bỏ qua
    if (Number.isNaN(value)) {
      setWeightError('Trọng lượng không hợp lệ. Vui lòng nhập số.');
      return;
    }

    // Chỉ chấp nhận trong khoảng (0, 90]
    if (value <= 0 || value > 90) {
      // Không cập nhật form nếu ngoài khoảng và hiển thị lỗi
      setWeightError('Chỉ cho phép nhập trọng lượng trong khoảng lớn hơn 0 kg và không quá 90 kg.');
      return;
    }

    setWeightError(null);
    onChange(e);
  };

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
            <div className="flex items-start gap-2 relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                disabled={categoriesLoading}
                className="mt-1 px-3 py-2 w-full text-left border border-gray-300 rounded-lg shadow-sm bg-white focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {pendingCategoryIds.length > 0
                  ? `Đang chọn ${pendingCategoryIds.length} danh mục`
                  : categoriesLoading
                    ? 'Đang tải danh mục...'
                    : 'Chọn danh mục'}
              </button>
              {showCategoryDropdown && !categoriesLoading && (
                <div className="absolute z-20 mt-12 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 px-2 py-1">Không có dữ liệu danh mục</p>
                  ) : (
                    renderCategoryCheckboxes(categories)
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onCategoryChange(pendingCategoryIds);
                  setShowCategoryDropdown(false);
                }}
                className="mt-1 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                disabled={categoriesLoading}
              >
                Áp dụng
              </button>
            </div>
            <p className="mt-1 text-xs italic text-gray-500">
              {appliedCategoryNames.length > 0
                ? `Đã chọn: ${appliedCategoryNames.join(', ')}`
                : 'Chưa chọn danh mục'}
            </p>
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
                onChange={(e) => handleDimensionInputChange('l', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Dài (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              <input
                value={getDimensionParts.w}
                onChange={(e) => handleDimensionInputChange('w', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Rộng (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              <input
                value={getDimensionParts.h}
                onChange={(e) => handleDimensionInputChange('h', e.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="Cao (mm)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-orange-700">
              Lưu ý: Mỗi chiều Dài / Rộng / Cao không được vượt quá 1200 mm.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-500">* </span>Trọng lượng (kg)
          </label>
          <input
            name="weight"
            value={form.weight}
            onChange={handleWeightChange}
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
          {weightError && (
            <p className="mt-1 text-xs text-red-600">
              {weightError}
            </p>
          )}
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
