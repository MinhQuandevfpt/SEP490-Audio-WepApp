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
  {
    key: 'others',
    label: 'Mô tả nhanh',
    extractor: (p) => ({
      display:
        p.shortDescription ||
        p.description?.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 120) ||
        '-',
    }),
  },
];

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  open,
  loading,
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
      {loading ? (
        <div className="py-10 text-center text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead>
              <tr>
                <th className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-600">Tiêu chí</th>
                {products.map((product) => (
                  <th key={product.productId} className="bg-gray-50 px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-[11px] text-gray-400 flex items-center justify-center h-full">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                        <button
                          onClick={() => onRemove(product.productId)}
                          className="text-xs text-red-500 hover:text-red-600"
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
              {compareFields.map((field) => (
                <tr key={field.label} className="border-t border-gray-100">
                  <td className="bg-gray-50 px-4 py-3 font-medium text-gray-700 align-top">
                    <div>{field.label}</div>
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1 pr-4">{field.description}</p>
                    )}
                  </td>
                  {products.map((product) => {
                    const { display } = field.extractor(product);
                    const isBetter = field.highlight && highlightMap[field.key]?.has(product.productId);
                    return (
                      <td
                        key={`${field.label}-${product.productId}`}
                        className={`px-4 py-3 align-top ${
                          isBetter ? 'bg-orange-50 text-orange-700 font-semibold rounded' : ''
                        }`}
                      >
                        {display}
                        {isBetter && (
                          <div className="text-xs text-orange-600 font-semibold mt-1">Tốt hơn</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default ProductCompareModal;

