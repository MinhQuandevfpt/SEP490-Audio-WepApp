import React from 'react';
import SectionCard from './SectionCard';
import type { CategoryKey } from './CategorySpecsSchema';
import { CATEGORY_SPECS } from './CategorySpecsSchema';

export interface SpecsValues {
  connection: 'Wired' | 'Wireless' | 'Both';
  impedance?: string;
  sensitivity?: string;
  frequencyResponse?: string;
  highlights: string;
  description: string;
}

interface SpecsSectionProps {
  values: SpecsValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  colorChips: string[];
  highlightChips: string[];
  category?: CategoryKey;
  extraSpecs?: Record<string, string>;
  onExtraChange?: (key: string, value: string) => void;
}

const SpecsSection: React.FC<SpecsSectionProps> = ({ values, onChange, colorChips, highlightChips, category, extraSpecs = {}, onExtraChange }) => {
  return (
    <SectionCard title="Thông tin chi tiết" description="Thông số kỹ thuật và mô tả">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kết nối</label>
            <select name="connection" value={values.connection} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors">
              <option>Wired</option>
              <option>Wireless</option>
              <option>Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trở kháng (Ω)</label>
            <input name="impedance" value={values.impedance} onChange={onChange} type="text" placeholder="32Ω" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Độ nhạy (dB)</label>
            <input name="sensitivity" value={values.sensitivity} onChange={onChange} type="text" placeholder="105dB/mW" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dải tần (Hz)</label>
            <input name="frequencyResponse" value={values.frequencyResponse} onChange={onChange} type="text" placeholder="20Hz-20kHz" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Điểm nổi bật (phân tách bằng dấu phẩy)</label>
            <input name="highlights" value={values.highlights} onChange={onChange} type="text" placeholder="Driver 50mm, ANC, Bluetooth 5.3..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
          <textarea name="description" value={values.description} onChange={onChange} rows={6} placeholder="Mô tả tính năng, chất âm, phụ kiện, trải nghiệm sử dụng..." className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors resize-none" />
        </div>

        {category && CATEGORY_SPECS[category] && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-800">Thuộc tính riêng của danh mục</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORY_SPECS[category].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={extraSpecs[field.key] || ''}
                      onChange={e => onExtraChange?.(field.key, e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="">Chọn</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={extraSpecs[field.key] || ''}
                      onChange={e => onExtraChange?.(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    />
                  )}
                  {field.helpText && <div className="text-xs text-gray-500 mt-1">{field.helpText}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(colorChips.length > 0 || highlightChips.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colorChips.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Màu sắc</div>
                <div className="flex flex-wrap gap-2">{colorChips.map((c, i) => (<span key={`${c}_${i}`} className="px-2 py-1 rounded-full text-xs bg-gray-100 border">{c}</span>))}</div>
              </div>
            )}
            {highlightChips.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Điểm nổi bật</div>
                <div className="flex flex-wrap gap-2">{highlightChips.map((h, i) => (<span key={`${h}_${i}`} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{h}</span>))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default SpecsSection;


