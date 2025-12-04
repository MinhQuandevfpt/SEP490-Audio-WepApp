import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import type { CreateVoucherRequest } from '../../services/seller/VoucherService';
import { ProductService } from '../../services/seller/ProductService';
import type { Product, ProductListResponse } from '../../types/seller';

interface Props {
  onSubmit: (data: CreateVoucherRequest) => Promise<void> | void;
  submitting?: boolean;
}

const emptyForm: CreateVoucherRequest = {
  code: '',
  title: '',
  description: '',
  type: 'FIXED',
  discountValue: 0,
  discountPercent: null,
  maxDiscountValue: null,
  minOrderValue: 0,
  totalVoucherIssued: 0,
  totalUsageLimit: null,
  usagePerUser: 1,
  startTime: '',
  endTime: '',
  products: []
};

const VoucherForm: React.FC<Props> = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState<CreateVoucherRequest>(emptyForm);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerProductsLoading, setPickerProductsLoading] = useState<boolean>(false);

  const tooltips: Record<string, string> = {
    discountValue: 'Số tiền giảm giá cố định (VND). Ví dụ: 20.000đ giảm cho mỗi đơn hàng.',
    discountPercent: 'Phần trăm giảm giá. Ví dụ: 10% giảm trên tổng giá trị đơn hàng.',
    maxDiscountValue: 'Số tiền giảm tối đa khi áp dụng giảm theo phần trăm. Ví dụ: Giảm 20% nhưng tối đa 50.000đ.',
    minOrderValue: 'Giá tối thiểu của sản phẩm để kích hoạt voucher',
    totalVoucherIssued: 'Tổng số lượng voucher được phát hành. Người dùng có thể sử dụng tối đa số lượng này.',
    usagePerUser: 'Số lần tối đa mỗi người dùng có thể sử dụng voucher này. Ví dụ: Mỗi user dùng tối đa 2 lần.',
    promotionStockLimit: 'Số lượng sản phẩm tham gia vào chương trình khuyến mãi. Không được vượt quá số lượng tồn kho.',
    purchaseLimitPerCustomer: 'Số lượng sản phẩm tối đa mỗi khách hàng có thể mua với voucher này.',
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
    // Nếu không allowZero và giá trị là 0, trả về rỗng
    if (!allowZero && numericValue === '0') return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (formattedValue: string): number | null => {
    const cleaned = formattedValue.replace(/\./g, '').trim();
    if (!cleaned) return null;
    // Loại bỏ số 0 ở đầu (leading zeros) nhưng giữ lại nếu chỉ có 0
    const numStr = cleaned.replace(/^0+/, '') || '0';
    const num = Number(numStr);
    return isNaN(num) ? null : num;
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      // Load current seller's products, fetch larger page size to cover most cases
      const res: ProductListResponse = await ProductService.getMyProducts({ page: 0, size: 200 });
      // Handle both pagination structure (res.data.content) and direct array (res.data)
      const list = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.content || []);
      setProducts(list);
    } catch (e: any) {
      setProductsError(e?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products for picker modal with price filter
  const loadPickerProducts = async () => {
    try {
      setPickerProductsLoading(true);
      setProductsError(null);
      
      // Build query params with price filter
      const queryParams: any = {
        page: 0,
        size: 200,
        status: 'ACTIVE', // Chỉ lấy sản phẩm ACTIVE
      };
      
      // Nếu có minOrderValue, dùng làm minPrice
      if (form.minOrderValue && form.minOrderValue > 0) {
        queryParams.minPrice = form.minOrderValue;
      }
      
      const res: ProductListResponse = await ProductService.getMyProducts(queryParams);
      // Handle both pagination structure (res.data.content) and direct array (res.data)
      const list = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.content || []);
      setPickerProducts(list);
    } catch (e: any) {
      setProductsError(e?.message || 'Không thể tải danh sách sản phẩm');
      setPickerProducts([]);
    } finally {
      setPickerProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
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

  // Add product via modal selection (button opens modal)

  const updateProduct = (index: number, key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    }));
  };

  const removeProduct = (index: number) => {
    setForm(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== index) }));
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate: Giới hạn sản phẩm áp dụng không được vượt quá số lượng tồn kho
    form.products.forEach((product) => {
      if (product.productId) {
        const selectedProduct = products.find(p => p.productId === product.productId);
        if (selectedProduct) {
          const promotionStockLimit = product.promotionStockLimit ?? 0;
          const stockQuantity = selectedProduct.stockQuantity ?? 0;
          
          if (promotionStockLimit > stockQuantity) {
            errors.push(
              `Sản phẩm "${selectedProduct.name}": Giới hạn sản phẩm áp dụng (${promotionStockLimit}) không được vượt quá số lượng tồn kho (${stockQuantity})`
            );
          }
        }
      }
    });

    // Validate: Tổng giới hạn sản phẩm áp dụng không được lớn hơn tổng số phát hành
    const totalPromotionStockLimit = form.products.reduce((sum, product) => {
      return sum + (product.promotionStockLimit ?? 0);
    }, 0);
    
    const totalVoucherIssued = form.totalVoucherIssued ?? 0;
    
    if (totalPromotionStockLimit > totalVoucherIssued && totalVoucherIssued > 0) {
      errors.push(
        `Tổng giới hạn sản phẩm áp dụng (${totalPromotionStockLimit}) không được lớn hơn tổng số phát hành (${totalVoucherIssued})`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear errors if validation passes
    setValidationErrors([]);
    await onSubmit(form);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã voucher</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loại</label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              value={form.type}
              onChange={e => {
                const nextType = e.target.value as any;
                setForm(prev => ({
                  ...prev,
                  type: nextType,
                  // When switching to FIXED, maxDiscountValue is not applicable
                  maxDiscountValue: nextType === 'FIXED' ? null : prev.maxDiscountValue,
                }));
              }}
            >
              <option value="FIXED">Giảm tiền cố định</option>
              <option value="PERCENT">Giảm theo phần trăm</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea className="mt-1 w-full px-3 py-2 border rounded-lg" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.type === 'FIXED' ? (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                Giá trị giảm (VND)
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
              />
            </div>
          ) : (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                Giảm (%)
                <InfoTooltip fieldKey="discountPercent" />
              </label>
              <input type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.discountPercent ?? 0} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value), discountValue: null })} />
            </div>
          )}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Giảm tối đa (VND)
              <InfoTooltip fieldKey="maxDiscountValue" />
            </label>
            <input 
              type="text" 
              className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-400" 
              value={form.type === 'PERCENT' ? formatNumber(form.maxDiscountValue) : ''} 
              onChange={e => {
                const formatted = formatNumber(e.target.value);
                const numeric = parseFormattedNumber(formatted);
                setForm({ ...form, maxDiscountValue: numeric });
              }} 
              placeholder={form.type === 'PERCENT' ? 'VD: 50.000' : 'Chỉ áp dụng khi giảm theo %'} 
              disabled={form.type !== 'PERCENT'}
            />
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Tổng số phát hành
              <InfoTooltip fieldKey="totalVoucherIssued" />
            </label>
            <input 
              type="text" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.totalVoucherIssued && form.totalVoucherIssued > 0 ? formatNumber(form.totalVoucherIssued) : ''} 
              onChange={e => {
                const formatted = formatNumber(e.target.value);
                const numeric = parseFormattedNumber(formatted);
                setForm({ ...form, totalVoucherIssued: numeric ?? 0 });
              }} 
              placeholder="VD: 100" 
            />
          </div>
          {/* Removed: Tổng số lượt dùng (totalUsageLimit). Always send null per new API. */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Lượt dùng mỗi user
              <InfoTooltip fieldKey="usagePerUser" />
            </label>
            <input 
              type="text" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={form.usagePerUser && form.usagePerUser > 0 ? formatNumber(form.usagePerUser) : ''} 
              onChange={e => {
                const formatted = formatNumber(e.target.value);
                const numeric = parseFormattedNumber(formatted);
                setForm({ ...form, usagePerUser: numeric ?? 0 });
              }} 
              placeholder="VD: 1" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Thời gian bắt đầu</label>
            <input type="datetime-local" className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thời gian kết thúc</label>
            <input type="datetime-local" className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Sản phẩm áp dụng</h3>
          <button
            type="button"
            onClick={async () => {
              setPickerSelected(new Set(form.products.map(p => p.productId).filter(Boolean)));
              setShowPicker(true);
              // Load products với price filter khi mở picker
              await loadPickerProducts();
            }}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Thêm sản phẩm
          </button>
        </div>
        {form.products.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="space-y-3">
            {form.products.map((p, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600">Sản phẩm</label>
                  {productsLoading ? (
                    <div className="mt-1 px-3 py-2 text-sm text-gray-500 border rounded-lg">Đang tải sản phẩm...</div>
                  ) : productsError ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-red-600">{productsError}</span>
                      <button type="button" onClick={loadProducts} className="text-sm text-red-700 underline">Thử lại</button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Tìm theo tên sản phẩm..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                      />
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={p.productId}
                        onChange={e => updateProduct(idx, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products
                          .filter(pr => !productSearch.trim() || pr.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(pr => (
                            <option key={pr.productId} value={pr.productId}>
                              {pr.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
                {/* Removed per-product discount fields to match new API */}
                <div>
                  <label className="flex items-center text-xs text-gray-600">
                    Giới hạn sản phẩm áp dụng
                    <InfoTooltip fieldKey="promotionStockLimit" />
                  </label>
                  {(() => {
                    const selected = products.find(pr => pr.productId === p.productId);
                    const maxStock = selected?.stockQuantity ?? undefined;
                    return (
                      <input
                        type="text"
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        value={p.promotionStockLimit && p.promotionStockLimit > 0 ? formatNumber(p.promotionStockLimit) : ''}
                        onChange={e => {
                          const formatted = formatNumber(e.target.value);
                          const numeric = parseFormattedNumber(formatted);
                          if (numeric === null) {
                            updateProduct(idx, 'promotionStockLimit', null);
                            return;
                          }
                          const upper = typeof maxStock === 'number' ? maxStock : Number.MAX_SAFE_INTEGER;
                          const clamped = Math.min(Math.max(0, numeric), upper);
                          updateProduct(idx, 'promotionStockLimit', clamped);
                        }}
                        placeholder="VD: 10"
                      />
                    );
                  })()}
                </div>
                <div>
                  <label className="flex items-center text-xs text-gray-600">
                    Giới hạn mua/user
                    <InfoTooltip fieldKey="purchaseLimitPerCustomer" />
                  </label>
                  <input 
                    type="text" 
                    className="mt-1 w-full px-3 py-2 border rounded-lg" 
                    value={p.purchaseLimitPerCustomer && p.purchaseLimitPerCustomer > 0 ? formatNumber(p.purchaseLimitPerCustomer) : ''} 
                    onChange={e => {
                      const formatted = formatNumber(e.target.value);
                      const numeric = parseFormattedNumber(formatted);
                      updateProduct(idx, 'purchaseLimitPerCustomer', numeric);
                    }} 
                    placeholder="VD: 1" 
                  />
                </div>
                <div className="md:col-span-6 text-right">
                  <button type="button" onClick={() => removeProduct(idx)} className="text-sm text-red-600 hover:underline">Xoá</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Chọn sản phẩm
                {form.minOrderValue && form.minOrderValue > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Giá từ {formatNumber(form.minOrderValue)} đ trở lên)
                  </span>
                )}
              </h3>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setShowPicker(false)}>Đóng</button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={pickerProductsLoading}
              />
            </div>
            {pickerProductsLoading ? (
              <div className="text-sm text-gray-600 text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Đang tải sản phẩm...
              </div>
            ) : (
              (() => {
                // Sử dụng pickerProducts thay vì products (đã được filter theo giá)
                const filteredProducts = (pickerProducts.length > 0 ? pickerProducts : products)
                  .filter(pr => !productSearch.trim() || pr.name.toLowerCase().includes(productSearch.toLowerCase()));
                const allSelected = filteredProducts.length > 0 && filteredProducts.every(pr => pickerSelected.has(pr.productId));
              
              return (
                <>
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Chọn tất cả sản phẩm đang hiển thị
                            setPickerSelected(prev => {
                              const next = new Set(prev);
                              filteredProducts.forEach(pr => next.add(pr.productId));
                              return next;
                            });
                          } else {
                            // Bỏ chọn tất cả sản phẩm đang hiển thị
                            setPickerSelected(prev => {
                              const next = new Set(prev);
                              filteredProducts.forEach(pr => next.delete(pr.productId));
                              return next;
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Chọn tất cả ({filteredProducts.length} sản phẩm)
                      </span>
                    </label>
                  </div>
                  <div className="max-h-96 overflow-auto divide-y border rounded">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {form.minOrderValue && form.minOrderValue > 0
                          ? `Không tìm thấy sản phẩm nào có giá từ ${formatNumber(form.minOrderValue)} đ trở lên`
                          : 'Không tìm thấy sản phẩm'}
                      </div>
                    ) : (
                      filteredProducts.map(pr => (
                        <div key={pr.productId} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pickerSelected.has(pr.productId)}
                              onChange={(e) => {
                                setPickerSelected(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(pr.productId); else next.delete(pr.productId);
                                  return next;
                                });
                              }}
                              className="mt-1"
                            />
                            <img 
                              src={pr.images?.[0] || 'https://via.placeholder.com/80'} 
                              alt={pr.name} 
                              className="w-16 h-16 object-cover rounded border flex-shrink-0" 
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/80';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={pr.name}>{pr.name}</p>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500">Tồn kho:</p>
                                  <p className="text-xs font-medium text-gray-700">{pr.stockQuantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500">Giá gốc:</p>
                                  <p className="text-xs font-medium text-orange-600">
                                    {formatNumber(pr.price || 0)} đ
                                  </p>
                                </div>
                              </div>
                              {/* Hiển thị biến thể nếu có */}
                              {pr.variants && pr.variants.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Biến thể ({pr.variants.length}):</p>
                                  <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {pr.variants.map((variant, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 p-1.5 rounded">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-gray-600">
                                            {variant.optionName}: <span className="font-medium">{variant.optionValue}</span>
                                          </span>
                                          <span className="text-orange-600 font-medium">
                                            {formatNumber(variant.variantPrice)} đ
                                          </span>
                                        </div>
                                        <div className="text-gray-500 mt-0.5">
                                          Tồn: {variant.variantStock} | SKU: {variant.variantSku || 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
              })()
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1.5 border rounded" onClick={() => setShowPicker(false)}>Hủy</button>
              <button
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                onClick={() => {
                  const selectedIds = Array.from(pickerSelected);
                  if (selectedIds.length === 0) { setShowPicker(false); return; }
                  setForm(prev => ({
                    ...prev,
                    products: [
                      ...prev.products,
                      ...selectedIds
                        .filter(id => !prev.products.some(p => p.productId === id))
                        .map(id => ({ productId: id, promotionStockLimit: null, purchaseLimitPerCustomer: null }))
                    ]
                  }));
                  setShowPicker(false);
                }}
              >
                Thêm đã chọn
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className={`px-5 py-2 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
          {submitting ? 'Đang tạo...' : 'Tạo voucher'}
        </button>
      </div>
    </form>
  );
};

export default VoucherForm;


