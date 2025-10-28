import React, { useEffect, useState } from 'react';
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
  totalUsageLimit: 0,
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

  const addProduct = () => {
    setForm(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: '',
          discountPercent: null,
          discountAmount: null,
          promotionStockLimit: null,
          purchaseLimitPerCustomer: null
        }
      ]
    }));
  };

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
            <select className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
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
              <label className="block text-sm font-medium text-gray-700">Giá trị giảm (VND)</label>
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
              <label className="block text-sm font-medium text-gray-700">Giảm (%)</label>
              <input type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.discountPercent ?? 0} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value), discountValue: null })} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Giảm tối đa (VND)</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Đơn tối thiểu (VND)</label>
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
            <label className="block text-sm font-medium text-gray-700">Tổng số phát hành</label>
            <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.totalVoucherIssued ?? 0} onChange={e => setForm({ ...form, totalVoucherIssued: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tổng số lượt dùng</label>
            <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={form.totalUsageLimit ?? 0} onChange={e => setForm({ ...form, totalUsageLimit: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lượt dùng mỗi user</label>
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
          <button type="button" onClick={addProduct} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">+ Thêm sản phẩm</button>
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
                <div>
                  <label className="block text-xs text-gray-600">Giảm (%)</label>
                  <input type="number" min={0} max={100} className="mt-1 w-full px-3 py-2 border rounded-lg" value={p.discountPercent ?? 0} onChange={e => updateProduct(idx, 'discountPercent', e.target.value === '' ? null : Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Giảm (VND)</label>
                  <input 
                    type="text" 
                    className="mt-1 w-full px-3 py-2 border rounded-lg" 
                    value={formatNumber(p.discountAmount)} 
                    onChange={e => {
                      const formatted = formatNumber(e.target.value);
                      const numeric = parseFormattedNumber(formatted);
                      updateProduct(idx, 'discountAmount', numeric === 0 ? null : numeric);
                    }} 
                    placeholder="VD: 20.000" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Giới hạn kho KM</label>
                  <input type="number" min={0} className="mt-1 w-full px-3 py-2 border rounded-lg" value={p.promotionStockLimit ?? 0} onChange={e => updateProduct(idx, 'promotionStockLimit', e.target.value === '' ? null : Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Giới hạn mua/user</label>
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

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className={`px-5 py-2 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
          {submitting ? 'Đang tạo...' : 'Tạo voucher'}
        </button>
      </div>
    </form>
  );
};

export default VoucherForm;


