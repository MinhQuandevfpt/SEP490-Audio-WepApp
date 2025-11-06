import React, { useState, useRef } from 'react';
import type { ProductVoucherItem } from '../../services/customer/ProductViewService';
import './voucher-styles.css';

interface ProductVouchersProps {
  vouchers: ProductVoucherItem[];
}

const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';

const ProductVouchers: React.FC<ProductVouchersProps> = ({ vouchers }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [savedVouchers, setSavedVouchers] = useState<Set<number>>(new Set());
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (!vouchers || vouchers.length === 0) return null;

  const handleMouseEnter = (idx: number) => {
    const badgeElement = badgeRefs.current[idx];
    if (badgeElement) {
      const rect = badgeElement.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
    setHoveredIndex(idx);
  };

  const handleSave = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedVouchers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const getDiscountBadgeText = (v: ProductVoucherItem) => {
    if (v.type === 'PERCENT' && v.discountPercent) {
      return `Giảm ${v.discountPercent}%`;
    }
    if (v.discountValue) {
      return `Giảm ${Math.floor(v.discountValue / 1000)}k`;
    }
    return 'Giảm giá';
  };

  const getDiscountText = (v: ProductVoucherItem) => {
    const isPercent = v.type === 'PERCENT' && v.discountPercent;
    return isPercent
      ? `Giảm ${v.discountPercent}%`
      : v.discountValue
        ? `Giảm ${formatCurrency(v.discountValue)}`
        : 'Ưu đãi';
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Voucher Của Shop</span>
        </div>

        {/* Voucher badges - horizontal scroll */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {vouchers.map((voucher, idx) => {
              const badgeText = getDiscountBadgeText(voucher);
              
              return (
                <div
                  key={idx}
                  ref={(el) => { badgeRefs.current[idx] = el; }}
                  className="shrink-0"
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Badge - Chỉ hiện "Giảm %" */}
                  <div className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-medium cursor-pointer hover:bg-red-100 transition-colors whitespace-nowrap">
                    {badgeText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup portal - render outside container to avoid overflow clip */}
      {hoveredIndex !== null && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 animate-fadeIn"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            width: '320px',
            zIndex: 9999,
          }}
          onMouseEnter={() => setHoveredIndex(hoveredIndex)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="p-4">
            {/* Header with store logo */}
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {getDiscountText(vouchers[hoveredIndex])}
                </div>
                <div className="text-sm text-gray-600">
                  Đơn Tối Thiểu {vouchers[hoveredIndex].minOrderValue ? formatCurrency(vouchers[hoveredIndex].minOrderValue) : '0đ'}
                </div>
              </div>
            </div>

            {/* Voucher details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Mã:</span>
                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {vouchers[hoveredIndex].code}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">HSD:</span>
                <span className="text-gray-700">
                  {vouchers[hoveredIndex].endTime ? new Date(vouchers[hoveredIndex].endTime).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
              {vouchers[hoveredIndex].title && (
                <div className="text-xs text-gray-500 mt-2">
                  {vouchers[hoveredIndex].title}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <button
                onClick={(e) => handleSave(hoveredIndex, e)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  savedVouchers.has(hoveredIndex)
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {savedVouchers.has(hoveredIndex) ? 'Đã Lưu' : 'Lưu'}
              </button>
            </div>

            {/* Arrow pointer */}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductVouchers;
