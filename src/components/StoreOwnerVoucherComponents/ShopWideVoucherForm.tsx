import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { CreateShopWideVoucherRequest } from '../../services/seller/VoucherService';

interface Props {
  onSubmit: (data: CreateShopWideVoucherRequest) => Promise<void> | void;
  submitting?: boolean;
}

const emptyForm: CreateShopWideVoucherRequest = {
  code: '',
  title: '',
  description: '',
  type: 'FIXED',
  discountValue: 0,
  discountPercent: null,
  maxDiscountValue: null,
  minOrderValue: 0,
  startTime: '',
  endTime: '',
};

const ShopWideVoucherForm: React.FC<Props> = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState<CreateShopWideVoucherRequest>(emptyForm);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const tooltips: Record<string, string> = {
    discountValue: 'Số tiền giảm giá cố định (VND). Ví dụ: 20.000đ giảm cho mỗi đơn hàng.',
    discountPercent: 'Phần trăm giảm giá. Ví dụ: 10% giảm trên tổng giá trị đơn hàng.',
    maxDiscountValue: 'Số tiền giảm tối đa khi áp dụng giảm theo phần trăm. Ví dụ: Giảm 20% nhưng tối đa 50.000đ.',
    minOrderValue: 'Giá tối thiểu của đơn hàng để kích hoạt voucher',
  };

  const InfoTooltip: React.FC<{ fieldKey: string }> = ({ fieldKey }) => {
    const text = tooltips[fieldKey];
    if (!text) return null;
    return (
      <div className="info-tooltip-wrapper relative inline-block ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setTooltipKey(tooltipKey === fieldKey ? null : fieldKey);
          }}
          className="text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          <Info className="w-4 h-4" />
        </button>
        {tooltipKey === fieldKey && (
          <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
            {text}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    );
  };

  // Format numbers with dot thousands separators
  const formatNumber = (value: string | number | null | undefined, allowZero: boolean = false): string => {
    if (value == null || value === '') return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (!numericValue) return '';
    if (!allowZero && numericValue === '0') return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (formattedValue: string): number | null => {
    const cleaned = formattedValue.replace(/\./g, '').trim();
    if (!cleaned) return null;
    const numStr = cleaned.replace(/^0+/, '') || '0';
    const num = Number(numStr);
    return isNaN(num) ? null : num;
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    if (!tooltipKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.info-tooltip-wrapper')) {
        setTooltipKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tooltipKey]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!form.code || form.code.trim() === '') {
      errors.push('Mã voucher là bắt buộc');
    }

    if (!form.title || form.title.trim() === '') {
      errors.push('Tiêu đề là bắt buộc');
    }

    if (form.type === 'FIXED' && (!form.discountValue || form.discountValue <= 0)) {
      errors.push('Giá trị giảm phải lớn hơn 0 khi chọn loại giảm tiền cố định');
    }

    if (form.type === 'PERCENT' && (!form.discountPercent || form.discountPercent <= 0 || form.discountPercent > 100)) {
      errors.push('Phần trăm giảm phải từ 1% đến 100% khi chọn loại giảm theo phần trăm');
    }

    if (!form.startTime) {
      errors.push('Thời gian bắt đầu là bắt buộc');
    }

    if (!form.endTime) {
      errors.push('Thời gian kết thúc là bắt buộc');
    }

    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime);
      const end = new Date(form.endTime);
      if (start >= end) {
        errors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    
    // Prepare request body - only send required fields
    const requestBody: CreateShopWideVoucherRequest = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description?.trim() || '',
      type: form.type,
      startTime: form.startTime,
      endTime: form.endTime,
      minOrderValue: form.minOrderValue && form.minOrderValue > 0 ? form.minOrderValue : 0,
    };

    // Add discount fields based on type
    if (form.type === 'FIXED') {
      requestBody.discountValue = form.discountValue || 0;
      requestBody.discountPercent = null;
    } else {
      requestBody.discountPercent = form.discountPercent || 0;
      requestBody.discountValue = null;
      if (form.maxDiscountValue && form.maxDiscountValue > 0) {
        requestBody.maxDiscountValue = form.maxDiscountValue;
      }
    }

    await onSubmit(requestBody);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Vui lòng sửa các lỗi sau:</h3>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{error}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="flex-shrink-0 text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mã voucher <span className="text-red-500">*</span>
            </label>
            <input 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
              required 
              placeholder="VD: SALEALL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Loại <span className="text-red-500">*</span>
            </label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={form.type}
              onChange={e => {
                const nextType = e.target.value as 'FIXED' | 'PERCENT';
                setForm(prev => ({
                  ...prev,
                  type: nextType,
                  maxDiscountValue: nextType === 'FIXED' ? null : prev.maxDiscountValue,
                }));
              }}
            >
              <option value="FIXED">Giảm tiền cố định</option>
              <option value="PERCENT">Giảm theo phần trăm</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              required 
              placeholder="VD: Giảm 10% toàn shop"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              rows={3} 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="VD: Áp dụng cho mọi đơn hàng"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin giảm giá</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.type === 'FIXED' ? (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                Giá trị giảm (VND) <span className="text-red-500">*</span>
                <InfoTooltip fieldKey="discountValue" />
              </label>
              <input 
                type="text" 
                className="mt-1 w-full px-3 py-2 border rounded-lg" 
                value={formatNumber(form.discountValue)} 
                onChange={e => {
                  const formatted = formatNumber(e.target.value);
                  const numeric = parseFormattedNumber(formatted);
                  setForm({ ...form, discountValue: numeric ?? 0, discountPercent: null });
                }} 
                placeholder="VD: 10.000" 
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700">
                  Giảm (%) <span className="text-red-500">*</span>
                  <InfoTooltip fieldKey="discountPercent" />
                </label>
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  className="mt-1 w-full px-3 py-2 border rounded-lg" 
                  value={form.discountPercent ?? 0} 
                  onChange={e => setForm({ ...form, discountPercent: Number(e.target.value), discountValue: null })} 
                  required
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700">
                  Giảm tối đa (VND)
                  <InfoTooltip fieldKey="maxDiscountValue" />
                </label>
                <input 
                  type="text" 
                  className="mt-1 w-full px-3 py-2 border rounded-lg" 
                  value={formatNumber(form.maxDiscountValue)} 
                  onChange={e => {
                    const formatted = formatNumber(e.target.value);
                    const numeric = parseFormattedNumber(formatted);
                    setForm({ ...form, maxDiscountValue: numeric });
                  }} 
                  placeholder="VD: 50.000" 
                />
              </div>
            </>
          )}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Giá tối thiểu (VND)
              <InfoTooltip fieldKey="minOrderValue" />
            </label>
            <input 
              type="text" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={formatNumber(form.minOrderValue)} 
              onChange={e => {
                const formatted = formatNumber(e.target.value);
                const numeric = parseFormattedNumber(formatted);
                setForm({ ...form, minOrderValue: numeric ?? 0 });
              }} 
              placeholder="VD: 100.000" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian áp dụng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thời gian bắt đầu <span className="text-red-500">*</span>
            </label>
            <input 
              type="datetime-local" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.startTime} 
              onChange={e => setForm({ ...form, startTime: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thời gian kết thúc <span className="text-red-500">*</span>
            </label>
            <input 
              type="datetime-local" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.endTime} 
              onChange={e => setForm({ ...form, endTime: e.target.value })} 
              required 
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Voucher toàn shop sẽ áp dụng cho tất cả sản phẩm trong cửa hàng</li>
              <li>Không giới hạn số lượng voucher phát hành</li>
              <li>Không cần chọn sản phẩm cụ thể</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={submitting} 
          className={`px-5 py-2 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {submitting ? 'Đang tạo...' : 'Tạo voucher toàn shop'}
        </button>
      </div>
    </form>
  );
};

export default ShopWideVoucherForm;

