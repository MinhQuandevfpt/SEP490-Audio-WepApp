import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { RotateCcw, AlertTriangle, Package } from 'lucide-react';
import type { ReturnStats, ReturnedProduct } from '../../types/dashboard';
import { ProductService } from '../../services/seller/ProductService';
import type { Product } from '../../types/seller';

interface ReturnBarChartProps {
  returns: ReturnStats | null;
  loading?: boolean;
}

interface EnrichedReturnProduct extends ReturnedProduct {
  product?: Product;
  isLoading?: boolean;
  error?: boolean;
}

const ReturnBarChart: React.FC<ReturnBarChartProps> = ({ returns, loading = false }) => {
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedReturnProduct[]>([]);

  // Fetch product details for each returned item
  useEffect(() => {
    if (returns?.top5ReturnedProducts && returns.top5ReturnedProducts.length > 0) {
      fetchProductDetails();
    } else {
      setEnrichedProducts([]);
    }
  }, [returns]);

  const fetchProductDetails = async () => {
    if (!returns?.top5ReturnedProducts) return;
    const enriched: EnrichedReturnProduct[] = returns.top5ReturnedProducts.map(item => ({ 
      ...item, 
      isLoading: true 
    }));
    setEnrichedProducts(enriched);

    // Fetch all products in parallel
    const promises = returns.top5ReturnedProducts.map(async (item) => {
      try {
        const product = await ProductService.getProductById(item.productId);
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

  const getProductPrice = (product?: Product): number => {
    if (!product) return 0;
    if (product.price && product.price > 0) {
      return product.price;
    }
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].variantPrice || 0;
    }
    return 0;
  };

  const getProductImage = (product?: Product): string => {
    if (!product) return '';
    return product.images?.[0] || '';
  };

  // Prepare chart data
  const chartData = enrichedProducts.map((item, index) => ({
    name: `#${index + 1}`,
    productId: item.productId,
    productName: item.product?.name || 'Loading...',
    'Số lần trả': item.count
  }));

  // Gradient colors for bars (red shades)
  const colors = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!returns || chartData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 rounded-full bg-green-100 inline-flex mb-4">
            <RotateCcw className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Tuyệt vời! Không có sản phẩm nào bị trả hàng
          </h3>
          <p className="text-gray-500">
            Tiếp tục duy trì chất lượng sản phẩm và dịch vụ tốt!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-100">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Top 5 sản phẩm bị trả hàng
            </h2>
            <p className="text-sm text-gray-500">
              Tổng {formatNumber(returns.returnCount)} yêu cầu trả hàng
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-sm text-red-600 font-medium mb-1">Tổng số yêu cầu trả hàng</p>
          <p className="text-2xl font-bold text-red-700">
            {formatNumber(returns.returnCount)}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="text-sm text-orange-600 font-medium mb-1">Sản phẩm bị ảnh hưởng</p>
          <p className="text-2xl font-bold text-orange-700">
            {returns.top5ReturnedProducts.length}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number | undefined) => [formatNumber(value || 0), 'Số lần trả']}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.name === label);
              return item ? `${item.productName}` : label;
            }}
          />
          <Bar dataKey="Số lần trả" radius={[0, 8, 8, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Product details table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-gray-700 font-semibold w-16">Hạng</th>
              <th className="text-left py-3 px-3 text-gray-700 font-semibold">Sản phẩm</th>
              <th className="text-right py-3 px-3 text-gray-700 font-semibold">Giá bán</th>
              <th className="text-right py-3 px-3 text-gray-700 font-semibold">Số lần trả</th>
            </tr>
          </thead>
          <tbody>
            {enrichedProducts.map((item, index) => (
              <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                {/* Rank */}
                <td className="py-3 px-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500">
                    {index + 1}
                  </div>
                </td>

                {/* Product Info */}
                <td className="py-3 px-3">
                  {item.isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-2 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ) : item.error ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-800 font-medium">Không tải được</p>
                        <p className="text-xs text-gray-500 font-mono">{item.productId.substring(0, 8)}...</p>
                      </div>
                    </div>
                  ) : item.product ? (
                    <div className="flex items-center gap-3">
                      {getProductImage(item.product) ? (
                        <img
                          src={getProductImage(item.product)}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
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
                    <span className="text-xs text-gray-400 font-mono">{item.productId}</span>
                  )}
                </td>

                {/* Price */}
                <td className="py-3 px-3 text-right">
                  {item.product ? (
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(getProductPrice(item.product))}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Return Count */}
                <td className="py-3 px-3 text-right font-bold text-red-600">
                  {formatNumber(item.count)} lần
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnBarChart;

