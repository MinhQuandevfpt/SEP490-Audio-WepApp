import React, { useState, useEffect } from 'react';
import type { StoreVoucher } from '../../services/seller/VoucherService';
import { VoucherService } from '../../services/seller/VoucherService';
import { ProductService } from '../../services/seller/ProductService';
import type { Product } from '../../types/seller';

interface Props {
  voucher: StoreVoucher;
}

const formatCurrency = (v: number | null | undefined) => {
  if (v == null) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
};

const statusBadge = (status: StoreVoucher['status']) => {
  const map: Record<StoreVoucher['status'], string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-800',
    EXPIRED: 'bg-red-100 text-red-700',
    DISABLED: 'bg-gray-200 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

/**
 * Calculate discount amount and discounted price for a product based on voucher
 * @param originalPrice - Original price of the product (from /api/products/{productId})
 * @param voucher - Voucher information (from /api/shop-vouchers/{id})
 * @returns Object with discountAmount (số tiền giảm) and discountedPrice (giá còn)
 */
const calculateProductDiscount = (
  originalPrice: number,
  voucher: StoreVoucher
): { discountAmount: number; discountedPrice: number } => {
  let discountAmount = 0;

  if (voucher.type === 'PERCENT' && voucher.discountPercent != null) {
    // Calculate discount based on percentage
    discountAmount = Math.round((originalPrice * voucher.discountPercent) / 100);
    // Apply maxDiscountValue if exists
    if (voucher.maxDiscountValue != null && discountAmount > voucher.maxDiscountValue) {
      discountAmount = voucher.maxDiscountValue;
    }
  } else if (voucher.type === 'FIXED' && voucher.discountValue != null) {
    // Fixed discount amount
    discountAmount = voucher.discountValue;
  }

  // Ensure discount doesn't exceed original price
  discountAmount = Math.min(discountAmount, originalPrice);
  const discountedPrice = Math.max(0, originalPrice - discountAmount);

  return {
    discountAmount,
    discountedPrice,
  };
};

const VoucherCard: React.FC<Props> = ({ voucher }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StoreVoucher | null>(null);
  const [toggling, setToggling] = useState(false);
  const [productsData, setProductsData] = useState<Map<string, Product>>(new Map());
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const toggleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail) {
      try {
        setLoading(true);
        setError(null);
        const res = await VoucherService.getShopVoucherById(voucher.id);
        setDetail(res.data);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải chi tiết voucher');
      } finally {
        setLoading(false);
      }
    }
  };

  // Load product details when expanded and detail is loaded
  useEffect(() => {
    const loadProducts = async () => {
      const currentVoucher = detail || voucher;
      if (!expanded || !currentVoucher.products || currentVoucher.products.length === 0) {
        return;
      }

      // Get all product IDs from current voucher
      const allProductIds = currentVoucher.products.map(p => p.productId);

      // Check if we already have all products loaded
      const missingProductIds = allProductIds.filter(
        productId => !productsData.has(productId)
      );

      if (missingProductIds.length === 0) {
        return;
      }

      try {
        setProductsLoading(true);
        setProductsError(null);

        // Fetch all products in parallel
        const productPromises = missingProductIds.map(productId =>
          ProductService.getProductById(productId).catch(err => {
            console.error(`Error loading product ${productId}:`, err);
            return null;
          })
        );

        const productResults = await Promise.all(productPromises);

        // Update productsData map
        setProductsData(prev => {
          const newMap = new Map(prev);
          productResults.forEach((product, index) => {
            if (product) {
              newMap.set(missingProductIds[index], product);
            }
          });
          return newMap;
        });
      } catch (e: any) {
        setProductsError(e?.message || 'Không thể tải thông tin sản phẩm');
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, detail?.id, voucher.id]);
  const isPercent = voucher.type === 'PERCENT' && voucher.discountPercent != null;
  const valueLabel = isPercent
    ? `Giảm ${voucher.discountPercent}%`
    : `Giảm ${formatCurrency(voucher.discountValue)}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{voucher.code}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(voucher.status)}`}>{voucher.status}</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-gray-900">{voucher.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{voucher.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-orange-600">{valueLabel}</div>
          {voucher.minOrderValue != null && (
            <div className="text-xs text-gray-500">ĐH tối thiểu: {formatCurrency(voucher.minOrderValue)}</div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="text-gray-500">Bắt đầu: </span>
          <span>{new Date(voucher.startTime).toLocaleString('vi-VN')}</span>
        </div>
        <div>
          <span className="text-gray-500">Kết thúc: </span>
          <span>{new Date(voucher.endTime).toLocaleString('vi-VN')}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">Áp dụng cho {(voucher.products?.length ?? 0)} sản phẩm</div>
        <button type="button" onClick={toggleExpand} className="text-sm text-blue-600 hover:underline">
          {expanded ? 'Ẩn chi tiết ▲' : 'Xem chi tiết ▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3">
          {loading && (
            <div className="text-sm text-gray-600">Đang tải chi tiết...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">
              {error}
              <button type="button" onClick={toggleExpand} className="ml-2 underline">Thử lại</button>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-3 text-sm text-gray-800">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  disabled={toggling}
                  onClick={async () => {
                    try {
                      setToggling(true);
                      const current = detail || voucher;
                      const res = await VoucherService.toggleShopVoucher(current.id);
                      setDetail(res.data);
                    } catch (e) {
                    } finally {
                      setToggling(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-white text-sm ${toggling ? 'bg-gray-400' : (detail || voucher).status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {toggling ? 'Đang cập nhật...' : (detail || voucher).status === 'ACTIVE' ? 'Vô hiệu hoá' : 'Kích hoạt'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div><span className="text-gray-500">Mã:</span> <span className="font-medium">{(detail || voucher).code}</span></div>
                <div><span className="text-gray-500">Loại:</span> <span className="font-medium">{(detail || voucher).type}</span></div>
                <div><span className="text-gray-500">Giảm tiền:</span> <span className="font-medium">{formatCurrency((detail || voucher).discountValue)}</span></div>
                <div><span className="text-gray-500">Giảm %:</span> <span className="font-medium">{(detail || voucher).discountPercent ?? '—'}</span></div>
                <div><span className="text-gray-500">Đơn tối thiểu:</span> <span className="font-medium">{formatCurrency((detail || voucher).minOrderValue)}</span></div>
                <div><span className="text-gray-500">Trạng thái:</span> <span className={`font-medium`}>{(detail || voucher).status}</span></div>
                <div><span className="text-gray-500">Bắt đầu:</span> <span className="font-medium">{new Date((detail || voucher).startTime).toLocaleString('vi-VN')}</span></div>
                <div><span className="text-gray-500">Kết thúc:</span> <span className="font-medium">{new Date((detail || voucher).endTime).toLocaleString('vi-VN')}</span></div>
              </div>

              <div>
                <div className="text-gray-500 mb-1">Mô tả:</div>
                <div className="whitespace-pre-wrap break-words">{(detail || voucher).description}</div>
              </div>

              {((detail || voucher).products?.length || 0) > 0 && (
                <div>
                  <div className="text-gray-500 mb-2">Sản phẩm áp dụng:</div>
                  {productsLoading && (
                    <div className="text-sm text-gray-600 py-2">Đang tải thông tin sản phẩm...</div>
                  )}
                  {productsError && (
                    <div className="text-sm text-red-600 py-2">{productsError}</div>
                  )}
                  <div className="space-y-2">
                    {(detail || voucher).products.map(p => {
                      const currentVoucher = detail || voucher;
                      const product = productsData.get(p.productId);
                      const originalPrice = product?.price || 0;

                      // Calculate discount if we have product price
                      const { discountAmount, discountedPrice } = originalPrice > 0
                        ? calculateProductDiscount(originalPrice, currentVoucher)
                        : { discountAmount: 0, discountedPrice: 0 };

                      return (
                        <div key={p.productId} className="p-2 bg-gray-50 border rounded">
                          <div className="mb-2">
                            <span className="text-gray-500">Tên sản phẩm:</span>{' '}
                            <span className="font-medium">{p.productName}</span>
                          </div>
                          {originalPrice > 0 ? (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Giá gốc:</span>{' '}
                                <span className="font-medium text-gray-900">{formatCurrency(originalPrice)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Giá còn:</span>{' '}
                                <span className="font-medium text-green-600">{formatCurrency(discountedPrice)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Giá giảm:</span>{' '}
                                <span className="font-medium text-red-600">{formatCurrency(discountAmount)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {productsLoading ? 'Đang tải giá sản phẩm...' : 'Không thể tải giá sản phẩm'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoucherCard;


