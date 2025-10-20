import React, { useState, useRef, useEffect } from 'react';
import SectionCard from './SectionCard';
import { getCategoryFields, getCategoryGroups, getFieldsByGroup } from '../../utils/categoryFieldMapping';

export interface SpecsValues {
  // Common audio specs
  frequencyResponse?: string;
  sensitivity?: string;
  impedance?: string;
  powerHandling?: string;
  connectionType?: string;
  voltageInput?: string;
  
  // Category-specific specs (dynamic based on category)
  [key: string]: string | boolean | number | undefined;
}

// Technical unit suggestions for different field types
const TECHNICAL_SUGGESTIONS = {
  frequencyResponse: [
    { value: '20Hz-20kHz', label: '20Hz-20kHz (Full range)' },
    { value: '20Hz-40kHz', label: '20Hz-40kHz (Extended)' },
    { value: '30Hz-18kHz', label: '30Hz-18kHz (Standard)' },
    { value: '50Hz-15kHz', label: '50Hz-15kHz (Limited)' }
  ],
  sensitivity: [
    { value: '105dB/mW', label: '105dB/mW (High sensitivity)' },
    { value: '98dB/mW', label: '98dB/mW (Medium sensitivity)' },
    { value: '92dB/mW', label: '92dB/mW (Low sensitivity)' },
    { value: '110dB/V', label: '110dB/V (Voltage reference)' }
  ],
  impedance: [
    { value: '32Ω', label: '32Ω (Low impedance)' },
    { value: '16Ω', label: '16Ω (Very low impedance)' },
    { value: '64Ω', label: '64Ω (Medium impedance)' },
    { value: '300Ω', label: '300Ω (High impedance)' },
    { value: '600Ω', label: '600Ω (Professional)' }
  ],
  powerHandling: [
    { value: '100W RMS', label: '100W RMS (Continuous power)' },
    { value: '200W Peak', label: '200W Peak (Peak power)' },
    { value: '50W RMS', label: '50W RMS (Low power)' },
    { value: '300W RMS', label: '300W RMS (High power)' }
  ],
  voltageInput: [
    { value: '5V/2A', label: '5V/2A (USB standard)' },
    { value: '12V/1A', label: '12V/1A (DC adapter)' },
    { value: '3.3V/1A', label: '3.3V/1A (Low voltage)' },
    { value: '24V/2A', label: '24V/2A (High voltage)' }
  ],
  weight: [
    { value: '0.5kg', label: '0.5kg (Light)' },
    { value: '1.0kg', label: '1.0kg (Medium)' },
    { value: '2.0kg', label: '2.0kg (Heavy)' },
    { value: '5.0kg', label: '5.0kg (Very heavy)' }
  ],
  dimensions: [
    { value: '20x15x10cm', label: '20x15x10cm (Compact)' },
    { value: '30x20x15cm', label: '30x20x15cm (Medium)' },
    { value: '40x25x20cm', label: '40x25x20cm (Large)' }
  ],
  // Additional technical specs
  driverSize: [
    { value: '6.5 inch', label: '6.5 inch (Woofer)' },
    { value: '1 inch', label: '1 inch (Tweeter)' },
    { value: '3 inch', label: '3 inch (Mid-range)' },
    { value: '8 inch', label: '8 inch (Subwoofer)' }
  ],
  thd: [
    { value: '<0.01%', label: '<0.01% (Excellent)' },
    { value: '<0.1%', label: '<0.1% (Very good)' },
    { value: '<0.5%', label: '<0.5% (Good)' },
    { value: '<1%', label: '<1% (Acceptable)' }
  ],
  snr: [
    { value: '100dB', label: '100dB (Excellent)' },
    { value: '90dB', label: '90dB (Very good)' },
    { value: '80dB', label: '80dB (Good)' },
    { value: '70dB', label: '70dB (Acceptable)' }
  ],
  sampleRate: [
    { value: '192kHz', label: '192kHz (High resolution)' },
    { value: '96kHz', label: '96kHz (Studio quality)' },
    { value: '48kHz', label: '48kHz (CD quality)' },
    { value: '44.1kHz', label: '44.1kHz (Standard)' }
  ],
  bitDepth: [
    { value: '32-bit', label: '32-bit (Ultra high)' },
    { value: '24-bit', label: '24-bit (High)' },
    { value: '16-bit', label: '16-bit (Standard)' }
  ],
  maxSPL: [
    { value: '130dB', label: '130dB (Very loud)' },
    { value: '120dB', label: '120dB (Loud)' },
    { value: '110dB', label: '110dB (Moderate)' },
    { value: '100dB', label: '100dB (Quiet)' }
  ]
};

// Smart input component with suggestions
interface SmartInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  suggestions?: Array<{ value: string; label: string }>;
  className?: string;
  activeDropdown?: string | null;
  setActiveDropdown?: (name: string | null) => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  suggestions = [], 
  className = "",
  activeDropdown,
  setActiveDropdown
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const isActive = activeDropdown === name;
  const showSuggestions = isActive && filteredSuggestions.length > 0;

  // Filter suggestions based on input value
  useEffect(() => {
    if (isActive && suggestions.length > 0) {
      if (value) {
        const filtered = suggestions.filter(suggestion =>
          suggestion.value.toLowerCase().includes(value.toLowerCase()) ||
          suggestion.label.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions(suggestions);
      }
    }
  }, [value, suggestions, isActive]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionValue: string) => {
    const syntheticEvent = {
      target: { name, value: suggestionValue }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
    setActiveDropdown?.(null);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setActiveDropdown?.(name);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionRef.current?.contains(document.activeElement)) {
        setActiveDropdown?.(null);
      }
    }, 150);
  };

  return (
    <div className="relative smart-input-container">
      <input
        ref={inputRef}
        name={name}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors ${className}`}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto"
          style={{ 
            top: '100%',
            left: 0,
            right: 0
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handleSuggestionClick(suggestion.value)}
            >
              <div className="text-sm font-medium text-gray-900">{suggestion.value}</div>
              <div className="text-xs text-gray-500">{suggestion.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface SpecsSectionProps {
  values: SpecsValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  colorChips: string[];
  highlightChips: string[];
  categoryName?: string; // Tên category để lấy fields
}

const SpecsSection: React.FC<SpecsSectionProps> = ({ values, onChange, colorChips, highlightChips, categoryName }) => {
  // Lấy fields cho category hiện tại
  const categoryFields = categoryName ? getCategoryFields(categoryName) : {};
  const categoryGroups = categoryName ? getCategoryGroups(categoryName) : [];
  
  // Global state để quản lý dropdown đang mở
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Click outside handler để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.smart-input-container')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  // Render field input dựa trên type
  const renderFieldInput = (fieldKey: string, fieldConfig: any) => {
    const value = values[fieldKey] || '';
    const stringValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    
    // Check if this field has technical suggestions
    const hasSuggestions = TECHNICAL_SUGGESTIONS[fieldKey as keyof typeof TECHNICAL_SUGGESTIONS];
    
    switch (fieldConfig.type) {
      case 'select':
        return (
          <select
            name={fieldKey}
            value={stringValue}
            onChange={onChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Chọn {fieldConfig.label}</option>
            {fieldConfig.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <select
            name={fieldKey}
            value={stringValue}
            onChange={onChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Chọn</option>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        );
      
      case 'number':
        return (
          <input
            name={fieldKey}
            type="number"
            value={stringValue}
            onChange={onChange}
            placeholder={fieldConfig.placeholder}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            name={fieldKey}
            value={stringValue}
            onChange={onChange}
            rows={3}
            placeholder={fieldConfig.placeholder}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors resize-none"
          />
        );
      
      default: // text
        // Use SmartInput if suggestions are available
        if (hasSuggestions) {
          return (
            <SmartInput
              name={fieldKey}
              value={stringValue}
              onChange={onChange}
              placeholder={fieldConfig.placeholder}
              suggestions={hasSuggestions}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
            />
          );
        }
        
        return (
          <input
            name={fieldKey}
            type="text"
            value={stringValue}
            onChange={onChange}
            placeholder={fieldConfig.placeholder}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        );
    }
  };

  return (
    <SectionCard title="Thông tin chi tiết" description="Thông số kỹ thuật và mô tả">
      <div className="space-y-6">
        {/* Common audio specs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Thông số âm thanh chung</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dải tần (Hz)</label>
              <SmartInput
                name="frequencyResponse"
                value={values.frequencyResponse || ''}
                onChange={onChange}
                placeholder="20Hz-20kHz"
                suggestions={TECHNICAL_SUGGESTIONS.frequencyResponse}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Độ nhạy (dB)</label>
              <SmartInput
                name="sensitivity"
                value={values.sensitivity || ''}
                onChange={onChange}
                placeholder="105dB/mW"
                suggestions={TECHNICAL_SUGGESTIONS.sensitivity}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trở kháng (Ω)</label>
              <SmartInput
                name="impedance"
                value={values.impedance || ''}
                onChange={onChange}
                placeholder="32Ω"
                suggestions={TECHNICAL_SUGGESTIONS.impedance}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Công suất chịu đựng</label>
              <SmartInput
                name="powerHandling"
                value={values.powerHandling || ''}
                onChange={onChange}
                placeholder="100W RMS"
                suggestions={TECHNICAL_SUGGESTIONS.powerHandling}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kết nối</label>
              <input 
                name="connectionType" 
                value={values.connectionType || ''} 
                onChange={onChange} 
                type="text" 
                placeholder="Bluetooth 5.0, AUX, USB-C" 
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Điện áp</label>
              <SmartInput
                name="voltageInput"
                value={values.voltageInput || ''}
                onChange={onChange}
                placeholder="5V/2A"
                suggestions={TECHNICAL_SUGGESTIONS.voltageInput}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            </div>
          </div>
        </div>

        {/* Category-specific fields */}
        {categoryName && Object.keys(categoryFields).length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Thuộc tính riêng của danh mục: {categoryName}
            </h3>
            
            {categoryGroups.map(groupName => {
              const groupFields = getFieldsByGroup(categoryName, groupName);
              if (Object.keys(groupFields).length === 0) return null;
              
              return (
                <div key={groupName} className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 border-b pb-2">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(groupFields).map(([fieldKey, fieldConfig]) => (
                      <div key={fieldKey}>
                        <label className="block text-sm font-medium text-gray-700">
                          {fieldConfig.label}
                          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFieldInput(fieldKey, fieldConfig)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Color and highlight chips */}
        {(colorChips.length > 0 || highlightChips.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colorChips.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Màu sắc</div>
                <div className="flex flex-wrap gap-2">
                  {colorChips.map((c, i) => (
                    <span key={`${c}_${i}`} className="px-2 py-1 rounded-full text-xs bg-gray-100 border">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {highlightChips.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Điểm nổi bật</div>
                <div className="flex flex-wrap gap-2">
                  {highlightChips.map((h, i) => (
                    <span key={`${h}_${i}`} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default SpecsSection;


