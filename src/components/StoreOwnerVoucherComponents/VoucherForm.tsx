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

  const tooltips: Record<string, string> = {
    discountValue: 'Số tiền giảm giá cố định (VND). Ví dụ: 20.000đ giảm cho mỗi đơn hàng.',
    discountPercent: 'Phần trăm giảm giá. Ví dụ: 10% giảm trên tổng giá trị đơn hàng.',
    maxDiscountValue: 'Số tiền giảm tối đa khi áp dụng giảm theo phần trăm. Ví dụ: Giảm 20% nhưng tối đa 50.000đ.',
    minOrderValue: 'Giá trị đơn hàng tối thiểu để áp dụng voucher. Ví dụ: Đơn từ 100.000đ trở lên.',
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
  const formatNumber = (value: string | number | null | undefined): string => {
    if (value == null || value === '') return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (formattedValue: string): number => {
    return Number(formattedValue.replace(/\./g, ''));
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      // Load current seller's products, fetch larger page size to cover most cases
      const res: ProductListResponse = await ProductService.getMyProducts({ page: 0, size: 200 });
      const list = res.data?.content || res.data || [];
      setProducts(list);
    } catch (e: any) {
      setProductsError(e?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setProductsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 flex items-center">
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
                  setForm({ ...form, discountValue: numeric, discountPercent: null });
                }} 
                placeholder="VD: 10.000" 
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                Giảm (%)
                <InfoTooltip fieldKey="discountPercent" />
              </label>
              <input type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.discountPercent ?? 0} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value), discountValue: null })} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
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
                setForm({ ...form, maxDiscountValue: isNaN(numeric) ? null : numeric });
              }} 
              placeholder={form.type === 'PERCENT' ? 'VD: 50.000' : 'Chỉ áp dụng khi giảm theo %'} 
              disabled={form.type !== 'PERCENT'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              Đơn tối thiểu (VND)
              <InfoTooltip fieldKey="minOrderValue" />
            </label>
            <input 
              type="text" 
              className="mt-1 w-full px-3 py-2 border rounded-lg" 
              value={formatNumber(form.minOrderValue)} 
              onChange={e => {
                const formatted = formatNumber(e.target.value);
                const numeric = parseFormattedNumber(formatted);
                setForm({ ...form, minOrderValue: numeric });
              }} 
              placeholder="VD: 100.000" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              Tổng số phát hành
              <InfoTooltip fieldKey="totalVoucherIssued" />
            </label>
            <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.totalVoucherIssued ?? 0} onChange={e => setForm({ ...form, totalVoucherIssued: Number(e.target.value) })} />
          </div>
          {/* Removed: Tổng số lượt dùng (totalUsageLimit). Always send null per new API. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              Lượt dùng mỗi user
              <InfoTooltip fieldKey="usagePerUser" />
            </label>
            <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.usagePerUser ?? 0} onChange={e => setForm({ ...form, usagePerUser: Number(e.target.value) })} />
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
            onClick={() => {
              setPickerSelected(new Set(form.products.map(p => p.productId).filter(Boolean)));
              setShowPicker(true);
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
                  <label className="block text-xs text-gray-600 flex items-center">
                    Giới hạn sản phẩm áp dụng
                    <InfoTooltip fieldKey="promotionStockLimit" />
                  </label>
                  {(() => {
                    const selected = products.find(pr => pr.productId === p.productId);
                    const maxStock = selected?.stockQuantity ?? undefined;
                    return (
                      <input
                        type="number"
                        min={0}
                        max={maxStock}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        value={p.promotionStockLimit ?? 0}
                        onChange={e => {
                          const raw = e.target.value === '' ? null : Number(e.target.value);
                          if (raw === null) {
                            updateProduct(idx, 'promotionStockLimit', null);
                            return;
                          }
                          const upper = typeof maxStock === 'number' ? maxStock : Number.MAX_SAFE_INTEGER;
                          const clamped = Math.min(Math.max(0, raw), upper);
                          updateProduct(idx, 'promotionStockLimit', clamped);
                        }}
                      />
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 flex items-center">
                    Giới hạn mua/user
                    <InfoTooltip fieldKey="purchaseLimitPerCustomer" />
                  </label>
                  <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={p.purchaseLimitPerCustomer ?? 0} onChange={e => updateProduct(idx, 'purchaseLimitPerCustomer', e.target.value === '' ? null : Number(e.target.value))} />
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
              <h3 className="text-base font-semibold text-gray-900">Chọn sản phẩm</h3>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setShowPicker(false)}>Đóng</button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="max-h-96 overflow-auto divide-y border rounded">
              {(products || [])
                .filter(pr => !productSearch.trim() || pr.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map(pr => (
                  <label key={pr.productId} className="flex items-center gap-3 p-2 hover:bg-gray-50">
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
                    />
                    <img src={pr.images?.[0]} alt={pr.name} className="w-12 h-12 object-cover rounded border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={pr.name}>{pr.name}</p>
                      <p className="text-xs text-gray-500">Tồn kho: {pr.stockQuantity}</p>
                    </div>
                  </label>
                ))}
            </div>
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


