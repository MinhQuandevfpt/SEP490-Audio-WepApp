import React from 'react';
import { Modal } from 'antd';
import type { Product } from '../../services/customer/ProductListService';
import { formatCurrency } from '../../utils/orderStatus';

interface ProductCompareModalProps {
  open: boolean;
  loading: boolean;
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

type CompareField = {
  key: string;
  label: string;
  description?: string;
  highlight?: 'max' | 'min';
  extractor: (product: Product) => { display: React.ReactNode; numericValue?: number | null };
};

const parseWarrantyToMonths = (text?: string | null) => {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(tháng|thang|month|months|m)/i);
  if (match) return Number(match[1]);
  const days = text.match(/(\d+)\s*(ngày|day|days|d)/i);
  if (days) return Math.floor(Number(days[1]) / 30);
  return null;
};

const compareFields: CompareField[] = [
  { key: 'category', label: 'Danh mục', extractor: (p) => ({ display: p.categoryName || '-' }) },
  { key: 'brand', label: 'Thương hiệu', extractor: (p) => ({ display: p.brandName || '-' }) },
  { key: 'model', label: 'Model', extractor: (p) => ({ display: p.model || '-' }) },
  { key: 'material', label: 'Chất liệu', extractor: (p) => ({ display: p.material || '-' }) },
  { key: 'size', label: 'Kích thước', extractor: (p) => ({ display: p.dimensions || '-' }) },
  {
    key: 'weight',
    label: 'Trọng lượng',
    description: 'Nhẹ hơn sẽ dễ di chuyển hơn',
    highlight: 'min',
    extractor: (p) => ({
      display: typeof p.weight === 'number' ? `${p.weight} kg` : p.weight || '-',
      numericValue: typeof p.weight === 'number' ? p.weight : null,
    }),
  },
  {
    key: 'price',
    label: 'Giá / Biến thể',
    description: 'Giá thấp hơn giúp tối ưu chi phí',
    highlight: 'min',
    extractor: (p) => {
      if (p.variants?.length) {
        const variantPrices = p.variants.map((v) => v.variantPrice).filter((v) => typeof v === 'number');
        const minVariant = variantPrices.length ? Math.min(...(variantPrices as number[])) : undefined;
        return {
          display: (
            <div className="space-y-1">
              {p.variants.slice(0, 3).map((variant) => (
                <div key={variant.variantId}>
                  <span className="font-medium">{variant.optionValue}</span>: {formatCurrency(variant.variantPrice)}
                </div>
              ))}
            </div>
          ),
          numericValue: minVariant ?? null,
        };
      }
      const basePrice = p.finalPrice ?? p.price ?? 0;
      return { display: formatCurrency(basePrice), numericValue: basePrice };
    },
  },
  {
    key: 'warrantyTime',
    label: 'Bảo hành',
    description: 'Thời gian bảo hành dài hơn trấn an khách hàng hơn',
    highlight: 'max',
    extractor: (p) => ({
      display: p.warrantyPeriod || '-',
      numericValue: parseWarrantyToMonths(p.warrantyPeriod),
    }),
  },
  { key: 'warrantyType', label: 'Loại bảo hành', extractor: (p) => ({ display: p.warrantyType || '-' }) },
  { key: 'manufacturer', label: 'Nhà sản xuất', extractor: (p) => ({ display: p.manufacturerName || '-' }) },
  { key: 'origin', label: 'Xuất xứ', extractor: (p) => ({ display: p.manufacturerAddress || '-' }) },
  {
    key: 'frequency',
    label: 'Tần số đáp ứng',
    description: 'Dải tần rộng hơn tái tạo âm thanh tốt hơn',
    extractor: (p) => ({ display: p.frequencyResponse || '-' }),
  },
  { key: 'sensitivity', label: 'Độ nhạy (Sensitivity)', extractor: (p) => ({ display: p.sensitivity || '-' }) },
  { key: 'impedance', label: 'Trở kháng (Impedance)', extractor: (p) => ({ display: p.impedance || '-' }) },
  { key: 'power', label: 'Công suất (Power Handling)', extractor: (p) => ({ display: p.powerHandling || '-' }) },
  { key: 'connection', label: 'Kiểu kết nối', extractor: (p) => ({ display: p.connectionType || '-' }) },
  { key: 'headphoneType', label: 'Kiểu headphone', extractor: (p) => ({ display: p.headphoneType || '-' }) },
  {
    key: 'features',
    label: 'Tính năng nổi bật',
    extractor: (p) => ({ display: p.headphoneFeatures || '-' }),
  },
  {
    key: 'battery',
    label: 'Dung lượng pin',
    description: 'Dung lượng pin cao hơn dùng lâu hơn',
    highlight: 'max',
    extractor: (p) => ({
      display: p.batteryCapacity || '-',
      numericValue: p.batteryCapacity ? Number(p.batteryCapacity.replace(/[^0-9.]/g, '')) || null : null,
    }),
  },
  {
    key: 'charging',
    label: 'Tính năng sạc',
    extractor: (p) => ({ display: p.hasBuiltInBattery ? 'Có' : 'Không' }),
  },
];

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  open,
  products,
  onClose,
  onRemove,
}) => {
  const highlightMap = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    compareFields.forEach((field) => {
      if (!field.highlight) return;
      let bestValue: number | null = null;
      let bestSet = new Set<string>();

      products.forEach((product) => {
        const { numericValue } = field.extractor(product);
        if (numericValue === undefined || numericValue === null || Number.isNaN(numericValue)) {
          return;
        }

        if (
          bestValue === null ||
          (field.highlight === 'max' ? numericValue > bestValue : numericValue < bestValue)
        ) {
          bestValue = numericValue;
          bestSet = new Set([product.productId]);
        } else if (numericValue === bestValue) {
          bestSet.add(product.productId);
        }
      });

      map[field.key] = bestSet;
    });
    return map;
  }, [products]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="So sánh sản phẩm"
      width={Math.min(window.innerWidth - 80, 1100)}
    >
      <div className="overflow-x-auto">
          <div className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200 sticky left-0 z-10">
                    Tiêu chí
                  </th>
                  {products.map((product, index) => (
                    <th
                      key={product.productId}
                      className={`bg-gray-50 px-4 py-4 text-left border-r border-gray-300 ${
                        index === products.length - 1 ? '' : 'border-r-2'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3 max-w-[200px]">
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-300 overflow-hidden flex-shrink-0 bg-white">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 flex items-center justify-center h-full">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-center">
                          <p className="font-semibold text-gray-900 line-clamp-3 text-sm mb-2">
                            {product.name}
                          </p>
                          <button
                            onClick={() => onRemove(product.productId)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Loại khỏi so sánh
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareFields.map((field, fieldIndex) => (
                  <tr
                    key={field.label}
                    className={`border-t border-gray-200 ${
                      fieldIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700 align-top border-r border-gray-200 sticky left-0 z-10">
                      <div className="font-semibold">{field.label}</div>
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1 pr-4">{field.description}</p>
                      )}
                    </td>
                    {products.map((product, productIndex) => {
                      const { display } = field.extractor(product);
                      const isBetter = field.highlight && highlightMap[field.key]?.has(product.productId);
                      return (
                        <td
                          key={`${field.label}-${product.productId}`}
                          className={`px-4 py-3 align-top border-r border-gray-300 ${
                            productIndex === products.length - 1 ? '' : 'border-r-2'
                          } ${
                            isBetter
                              ? 'bg-orange-50 text-orange-700 font-semibold'
                              : 'bg-white'
                          }`}
                        >
                          <div className="min-h-[40px]">
                            {display}
                            {isBetter && (
                              <div className="text-xs text-orange-600 font-semibold mt-1 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                                Tốt hơn
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </Modal>
  );
};

export default ProductCompareModal;

