/**
 * Top Selling Table Component
 * Bảng hiển thị Top 10 sản phẩm bán chạy nhất
 */

import React, { useState, useEffect } from 'react';
import { Trophy, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import type { TopSellingItem } from '../../types/dashboard';
import { ProductService } from '../../services/seller/ProductService';
import type { Product } from '../../types/seller';

interface TopSellingTableProps {
  items: TopSellingItem[];
  loading?: boolean;
  dateRange?: { from: string; to: string };
}

interface EnrichedProduct extends TopSellingItem {
  product?: Product;
  isLoading?: boolean;
  error?: boolean;
}

const TopSellingTable: React.FC<TopSellingTableProps> = ({ 
  items, 
  loading = false,
  dateRange 
}) => {
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedProduct[]>([]);

  // Fetch product details for each item
  useEffect(() => {
    if (items && items.length > 0) {
      fetchProductDetails();
    } else {
      setEnrichedProducts([]);
    }
  }, [items]);

  const fetchProductDetails = async () => {
    const enriched: EnrichedProduct[] = items.map(item => ({ ...item, isLoading: true }));
    setEnrichedProducts(enriched);

    // Fetch all products in parallel
    const promises = items.map(async (item) => {
      try {
        const product = await ProductService.getProductById(item.refId);
        return { ...item, product, isLoading: false, error: false };
      } catch (error) {
        return { ...item, isLoading: false, error: true };
      }
    });

    const results = await Promise.all(promises);
    setEnrichedProducts(results);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateRange = (): string => {
    if (!dateRange) return '';
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    return `${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}`;
  };

  const getProductImage = (product?: Product): string => {
    if (!product) return '';
    // Product có field `images` là array string[]
    return product.images?.[0] || '';
  };

  const getProductPrice = (product?: Product): number => {
    if (!product) return 0;
    // Lấy giá từ field `price` hoặc từ variant đầu tiên
    if (product.price && product.price > 0) {
      return product.price;
    }
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].variantPrice || 0;
    }
    return 0;
  };

  // Medal colors for top 3
  const getMedalColor = (index: number): string => {
    if (index === 0) return 'bg-yellow-500'; // Gold
    if (index === 1) return 'bg-gray-400';   // Silver
    if (index === 2) return 'bg-amber-700';  // Bronze
    return 'bg-gray-200';
  };


  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Không có sản phẩm nào được bán
          </h3>
          <p className="text-gray-500 mb-2">
            Chưa có dữ liệu sản phẩm bán chạy trong khoảng thời gian này
          </p>
          {dateRange && (
            <p className="text-sm font-semibold text-orange-600">
              {formatDateRange()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-amber-100">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Top 10 sản phẩm bán chạy
          </h2>
          <p className="text-sm text-gray-500">
            Xếp hạng theo số lượng bán ra
            {dateRange && (
              <span className="ml-2 text-orange-600 font-medium">
                • {formatDateRange()}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary card for top seller */}
      {enrichedProducts.length > 0 && enrichedProducts[0].product && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-3">
                {getProductImage(enrichedProducts[0].product) && (
                  <img
                    src={getProductImage(enrichedProducts[0].product)}
                    alt={enrichedProducts[0].product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div>
                  <p className="text-sm text-amber-700 font-medium">Sản phẩm bán chạy nhất</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {enrichedProducts[0].product.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-700">
                {formatNumber(enrichedProducts[0].quantitySold)}
              </p>
              <p className="text-xs text-amber-600">sản phẩm đã bán</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-16">
                Hạng
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Sản phẩm
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Giá bán
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Số lượng bán
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Xu hướng
              </th>
            </tr>
          </thead>
          <tbody>
            {enrichedProducts.map((item, index) => (
              <tr
                key={item.refId}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${getMedalColor(
                      index
                    )}`}
                  >
                    {index + 1}
                  </div>
                </td>

                {/* Product Info */}
                <td className="py-3 px-4">
                  {item.isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ) : item.error ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">Không tải được</p>
                        <p className="text-xs text-gray-500 font-mono">{item.refId.substring(0, 8)}...</p>
                      </div>
                    </div>
                  ) : item.product ? (
                    <div className="flex items-center gap-3">
                      {getProductImage(item.product) ? (
                        <img
                          src={getProductImage(item.product)}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.product.categoryName || ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">{item.refId}</span>
                  )}
                </td>

                {/* Price */}
                <td className="py-3 px-4 text-right">
                  {item.product ? (
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(getProductPrice(item.product))}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Quantity Sold */}
                <td className="py-3 px-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-gray-800">
                      {formatNumber(item.quantitySold)}
                    </span>
                    <span className="text-xs text-gray-500">sản phẩm</span>
                  </div>
                </td>

                {/* Trend Badge */}
                <td className="py-3 px-4 text-right">
                  {index < 3 ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>Hot</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <ShoppingBag className="w-3 h-3" />
                      <span>Good</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TopSellingTable;

