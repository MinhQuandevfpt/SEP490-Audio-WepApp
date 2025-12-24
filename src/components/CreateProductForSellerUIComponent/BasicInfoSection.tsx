import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from './SectionCard';
import { TinyMCEEditor } from '../common';

// Danh sách suggestions cho các trường
const BRAND_SUGGESTIONS = [
  'Sony', 'Sennheiser', 'JBL', 'Bose', 'Audio-Technica', 'AKG', 'Shure', 
  'Beyerdynamic', 'Focal', 'Bowers & Wilkins', 'Bang & Olufsen', 'Denon',
  'Marantz', 'Yamaha', 'Pioneer', 'Technics', 'Rega', 'Pro-Ject', 'AudioQuest',
  'Cambridge Audio', 'NAD', 'Rotel', 'McIntosh', 'KEF', 'Klipsch', 'Polk Audio',
  'ELAC', 'Wharfedale', 'Monitor Audio', 'Dynaudio', 'MartinLogan', 'Sonus Faber',
  'FiiO', 'iFi Audio', 'Chord Electronics', 'Astell & Kern', 'Audeze', 'HiFiMAN',
  'Grado', 'Meze Audio', 'Fostex', 'Ultrasone', 'Final Audio', 'Campfire Audio',
  'Empire Ears', '64 Audio', 'Noble Audio', 'JH Audio', 'Westone', 'Etymotic',
  'RHA', '1MORE', 'Anker', 'Soundcore', 'Jabra', 'Plantronics', 'SteelSeries',
  'HyperX', 'Corsair', 'Logitech', 'Razer', 'Creative', 'ASUS', 'MSI'
];

const MATERIAL_SUGGESTIONS = [
  'Nhựa ABS', 'Nhựa PC', 'Nhựa PP', 'Nhôm', 'Thép không gỉ', 'Kim loại',
  'Da thật', 'Da PU', 'Vải', 'Lưới', 'Gỗ', 'Gỗ MDF', 'Gỗ veneer',
  'Carbon fiber', 'Kevlar', 'Titanium', 'Đồng', 'Bạc', 'Vàng',
  'Silicone', 'Cao su', 'Foam', 'Memory foam', 'Gel', 'Leather',
  'Fabric', 'Mesh', 'Metal mesh', 'Plastic', 'Polycarbonate', 'Acrylic',
  'Glass', 'Ceramic', 'Bamboo', 'Cork', 'Felt', 'Velour', 'Suede'
];

// NOTE: CONNECTION_SUGGESTIONS và VOLTAGE_SUGGESTIONS từng được dùng cho
// các field "connectionType" và "voltageInput". Do API POST /api/products
// hiện không còn 2 thuộc tính này nên UI tương ứng đã bị ẩn và các hằng số
// gợi ý cũng được loại bỏ để tránh gửi dữ liệu thừa.

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
  const [dimensionError, setDimensionError] = useState<{ part: 'l' | 'w' | 'h' | null; message: string | null }>({
    part: null,
    message: null,
  });
  
  // State cho suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  
  // Helper function để parse giá trị thành mảng (split by comma) - dùng cho tất cả các trường có suggestions
  const parseValueToArray = (value: string): string[] => {
    if (!value) return [];
    return value.split(',').map(item => item.trim()).filter(Boolean);
  };
  
  // Helper function để format mảng thành string - dùng cho tất cả các trường có suggestions
  const formatArrayToString = (items: string[]): string => {
    return items.join(', ');
  };
  
  // Helper function để lấy giá trị hiện tại của field
  const getFieldValue = (field: 'brandName' | 'material' | 'connectionType' | 'voltageInput'): string => {
    switch (field) {
      case 'brandName': return form.brandName;
      case 'material': return form.material;
      case 'connectionType': return form.connectionType;
      case 'voltageInput': return form.voltageInput;
      default: return '';
    }
  };
  
  // Helper function để thêm item vào giá trị (cho phép chọn nhiều) - dùng cho tất cả các trường có suggestions
  const addItemToValue = (field: 'brandName' | 'material' | 'connectionType' | 'voltageInput', item: string) => {
    const currentValue = getFieldValue(field);
    const currentItems = parseValueToArray(currentValue);
    
    // Không thêm nếu đã có
    if (currentItems.includes(item)) return;
    
    const newItems = [...currentItems, item];
    const newValue = formatArrayToString(newItems);
    
    handleInputWithSuggestions(field, newValue);
  };
  
  // Helper function để xóa item khỏi giá trị - dùng cho tất cả các trường có suggestions
  const removeItemFromValue = (field: 'brandName' | 'material' | 'connectionType' | 'voltageInput', itemToRemove: string) => {
    const currentValue = getFieldValue(field);
    const currentItems = parseValueToArray(currentValue);
    const newItems = currentItems.filter(item => item !== itemToRemove);
    const newValue = formatArrayToString(newItems);
    
    handleInputWithSuggestions(field, newValue);
  };

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
      setDimensionError({ part: null, message: null });
      onDimensionChange(part, '');
      return;
    }

    // Chỉ giữ lại chữ số
    const numeric = raw.replace(/[^\d]/g, '');
    if (!numeric) {
      const partLabels = { l: 'Dài', w: 'Rộng', h: 'Cao' };
      setDimensionError({
        part,
        message: `Chiều ${partLabels[part]} chỉ được nhập số.`,
      });
      // Không cập nhật form state khi không có số hợp lệ
      return;
    }

    // numeric is guaranteed to be a non-empty digit string here, so Number(numeric) will never be NaN
    const value = Number(numeric);

    // Không cho nhập giá trị = 0 hoặc quá 1200 mm - không cập nhật form state với giá trị không hợp lệ
    const partLabels = { l: 'Dài', w: 'Rộng', h: 'Cao' };
    if (value === 0) {
      setDimensionError({
        part,
        message: `Chiều ${partLabels[part]} phải lớn hơn 0 mm.`,
      });
      // Không cập nhật form state với giá trị = 0
      return;
    }
    if (value > 1200) {
      setDimensionError({
        part,
        message: `Chiều ${partLabels[part]} không được vượt quá 1200 mm.`,
      });
      // Không cập nhật form state với giá trị vượt quá giới hạn
      return;
    }

    // Giá trị hợp lệ (0 < value <= 1200) - xóa lỗi và cập nhật form state
    setDimensionError({ part: null, message: null });
    onDimensionChange(part, numeric);
  };

  // Helper function để filter suggestions
  const getFilteredSuggestions = (field: string, suggestions: string[]): string[] => {
    const query = searchQuery[field] || '';
    if (!query.trim()) return suggestions.slice(0, 10); // Hiển thị 10 gợi ý đầu tiên khi chưa nhập
    const queryLower = query.toLowerCase();
    return suggestions.filter(s => s.toLowerCase().includes(queryLower)).slice(0, 10);
  };

  // Handler cho input với suggestions
  const handleInputWithSuggestions = (
    field: 'brandName' | 'material' | 'connectionType' | 'voltageInput',
    value: string
  ) => {
    onChange({
      target: { name: field, value }
    } as React.ChangeEvent<HTMLInputElement>);
    
    setSearchQuery(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Chỉ cho phép trọng lượng trong khoảng (0 - 27] kg
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Cho phép rỗng để user xoá nhập lại
    if (raw.trim() === '') {
      setWeightError(null);
      onChange(e); // Cập nhật form state với giá trị rỗng
      return;
    }

    // Chuẩn hoá: thay dấu phẩy thành chấm trước khi parse
    const normalized = raw.replace(',', '.');
    const value = Number(normalized);

    // Nếu không phải số hợp lệ thì hiển thị lỗi và không cập nhật form state
    if (Number.isNaN(value)) {
      setWeightError('Trọng lượng không hợp lệ. Vui lòng nhập số.');
      onChange(e);
      return;
    }

    // Chỉ chấp nhận trong khoảng (0, 27]
    if (value <= 0 || value > 27) {
      // Hiển thị lỗi nhưng vẫn cho phép user tiếp tục nhập cho đến khi hợp lệ
      setWeightError('Chỉ cho phép nhập trọng lượng trong khoảng lớn hơn 0 kg và không quá 27 kg.');
      onChange(e);
      return;
    }

    // Giá trị hợp lệ - xóa lỗi và cập nhật form state
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
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              <span className="text-red-500">* </span>Thương hiệu
            </label>
            <div className="relative mt-1">
              {/* Hiển thị các tag đã chọn */}
              {parseValueToArray(form.brandName).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {parseValueToArray(form.brandName).map((item, index) => (
                    <span
                      key={`brand-tag-${index}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeItemFromValue('brandName', item)}
                        className="hover:text-orange-900 focus:outline-none"
                        title="Xóa"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <input
                name="brandName"
                value={form.brandName}
                onChange={(e) => handleInputWithSuggestions('brandName', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, brandName: true }))}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(prev => ({ ...prev, brandName: false }));
                  }, 200);
                }}
                type="text"
                placeholder="VD: Sony, Sennheiser, JBL (có thể chọn nhiều)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              {showSuggestions.brandName && getFilteredSuggestions('brandName', BRAND_SUGGESTIONS).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 mb-2 px-2 font-medium">Gợi ý thương hiệu (chọn nhiều):</p>
                    <div className="space-y-1">
                      {getFilteredSuggestions('brandName', BRAND_SUGGESTIONS).map((brand, index) => {
                        const isSelected = parseValueToArray(form.brandName).includes(brand);
                        return (
                          <button
                            key={`brand-${index}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (isSelected) {
                                removeItemFromValue('brandName', brand);
                              } else {
                                addItemToValue('brandName', brand);
                              }
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors rounded border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'hover:bg-orange-50 hover:text-orange-700'
                            }`}
                          >
                            <span className={`inline-block w-4 h-4 border-2 rounded ${
                              isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
                            } flex items-center justify-center`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </span>
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
            <div className="relative mt-1">
              {/* Hiển thị các tag đã chọn */}
              {parseValueToArray(form.material).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {parseValueToArray(form.material).map((item, index) => (
                    <span
                      key={`material-tag-${index}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeItemFromValue('material', item)}
                        className="hover:text-orange-900 focus:outline-none"
                        title="Xóa"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <input
                name="material"
                value={form.material}
                onChange={(e) => handleInputWithSuggestions('material', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, material: true }))}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(prev => ({ ...prev, material: false }));
                  }, 200);
                }}
                type="text"
                placeholder="VD: Nhựa ABS, Nhôm, Da (có thể chọn nhiều)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
              {showSuggestions.material && getFilteredSuggestions('material', MATERIAL_SUGGESTIONS).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 mb-2 px-2 font-medium">Gợi ý chất liệu (chọn nhiều):</p>
                    <div className="space-y-1">
                      {getFilteredSuggestions('material', MATERIAL_SUGGESTIONS).map((material, index) => {
                        const isSelected = parseValueToArray(form.material).includes(material);
                        return (
                          <button
                            key={`material-${index}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (isSelected) {
                                removeItemFromValue('material', material);
                              } else {
                                addItemToValue('material', material);
                              }
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors rounded border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'hover:bg-orange-50 hover:text-orange-700'
                            }`}
                          >
                            <span className={`inline-block w-4 h-4 border-2 rounded ${
                              isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
                            } flex items-center justify-center`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </span>
                            {material}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            {dimensionError.message && dimensionError.part && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {dimensionError.message}
              </p>
            )}
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
      </div>
    </SectionCard>
  );
};

export default BasicInfoSection;
