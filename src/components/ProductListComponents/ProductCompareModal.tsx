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

// Helper function to get attribute value from attributeValues array
const getAttributeValue = (product: Product, attributeName: string): string | null => {
  if (!product.attributeValues || !Array.isArray(product.attributeValues)) {
    return null;
  }
  const attr = product.attributeValues.find(a => a.attributeName === attributeName);
  return attr ? String(attr.value) : null;
};

// Helper function to get category name from categories array
const getCategoryName = (product: Product): string => {
  if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
    return product.categories[0].categoryName;
  }
  return product.categoryName || product.category || '-';
};

const compareFields: CompareField[] = [
  { key: 'category', label: 'Danh mục', extractor: (p) => ({ display: getCategoryName(p) }) },
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
        // Support new variant structure: price field, or old structure: variantPrice
        const variantPrices = p.variants.map((v) => v.price ?? v.variantPrice).filter((v) => typeof v === 'number');
        const minVariant = variantPrices.length ? Math.min(...(variantPrices as number[])) : undefined;
        return {
          display: (
            <div className="space-y-1">
              {p.variants.slice(0, 3).map((variant) => {
                const variantPrice = variant.price ?? variant.variantPrice ?? 0;
                return (
                  <div key={variant.variantId}>
                    <span className="font-medium">{variant.optionValue}</span>: {formatCurrency(variantPrice)}
                  </div>
                );
              })}
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
    extractor: (p) => ({ display: getAttributeValue(p, 'frequencyResponse') || p.frequencyResponse || '-' }),
  },
  { 
    key: 'sensitivity', 
    label: 'Độ nhạy (Sensitivity)', 
    extractor: (p) => ({ display: getAttributeValue(p, 'sensitivity') || p.sensitivity || '-' }) 
  },
  { 
    key: 'impedance', 
    label: 'Trở kháng (Impedance)', 
    extractor: (p) => ({ display: getAttributeValue(p, 'impedance') || p.impedance || '-' }) 
  },
  { 
    key: 'power', 
    label: 'Công suất (Power Handling)', 
    extractor: (p) => ({ display: getAttributeValue(p, 'powerHandling') || p.powerHandling || '-' }) 
  },
  { key: 'connection', label: 'Kiểu kết nối', extractor: (p) => ({ display: p.connectionType || '-' }) },
  { key: 'headphoneType', label: 'Kiểu headphone', extractor: (p) => ({ display: p.headphoneType || '-' }) },
  {
    key: 'features',
    label: 'Tính năng nổi bật',
    extractor: (p) => ({ display: p.headphoneFeatures || getAttributeValue(p, 'headphoneFeatures') || '-' }),
  },
  // Additional dynamic attributes from attributeValues
  {
    key: 'driverConfiguration',
    label: 'Cấu hình driver',
    extractor: (p) => ({ display: getAttributeValue(p, 'driverConfiguration') || p.driverConfiguration || '-' }),
  },
  {
    key: 'driverSize',
    label: 'Kích thước driver',
    extractor: (p) => ({ display: getAttributeValue(p, 'driverSize') || p.driverSize || '-' }),
  },
  {
    key: 'enclosureType',
    label: 'Loại thùng loa',
    extractor: (p) => ({ display: getAttributeValue(p, 'enclosureType') || p.enclosureType || '-' }),
  },
  {
    key: 'crossoverFrequency',
    label: 'Tần cắt',
    extractor: (p) => ({ display: getAttributeValue(p, 'crossoverFrequency') || p.crossoverFrequency || '-' }),
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

// Helper function to check if a field has at least one product with a value
const hasAnyValue = (field: CompareField, products: Product[]): boolean => {
  return products.some((product) => {
    const { display } = field.extractor(product);
    
    // Handle ReactNode (like price variants)
    if (React.isValidElement(display)) {
      // If it's a React element, check if it has children/content
      return true; // Assume React elements have content
    }
    
    // Handle string values
    const displayStr = String(display || '').trim();
    return displayStr !== '-' && displayStr !== '' && displayStr.toLowerCase() !== 'không';
  });
};

// Helper function to get all dynamic attributes from products' attributeValues
const getDynamicAttributeFields = (products: Product[]): CompareField[] => {
  // Collect all unique attributes from all products
  const attributeMap = new Map<string, { attributeLabel: string; dataType: string }>();
  
  products.forEach((product) => {
    if (product.attributeValues && Array.isArray(product.attributeValues)) {
      product.attributeValues.forEach((attr) => {
        if (!attributeMap.has(attr.attributeName)) {
          attributeMap.set(attr.attributeName, {
            attributeLabel: attr.attributeLabel || attr.attributeName,
            dataType: attr.dataType || 'STRING',
          });
        }
      });
    }
  });
  
  // Get list of already covered attribute names from hardcoded fields
  const coveredAttributeNames = new Set<string>([
    'frequencyResponse',
    'sensitivity',
    'impedance',
    'powerHandling',
    'headphoneFeatures',
    'driverConfiguration',
    'driverSize',
    'enclosureType',
    'crossoverFrequency',
  ]);
  
  // Create CompareField for each uncovered attribute
  const dynamicFields: CompareField[] = [];
  attributeMap.forEach((info, attributeName) => {
    // Skip if already covered by hardcoded fields
    if (coveredAttributeNames.has(attributeName)) {
      return;
    }
    
    // Create extractor for this attribute
    const extractor = (p: Product) => {
      const value = getAttributeValue(p, attributeName);
      const displayValue = value || '-';
      
      // Try to parse numeric value for potential highlighting
      let numericValue: number | null = null;
      if (info.dataType === 'NUMBER' && value) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          numericValue = parsed;
        }
      }
      
      return {
        display: displayValue,
        numericValue,
      };
    };
    
    dynamicFields.push({
      key: `attr_${attributeName}`,
      label: info.attributeLabel,
      extractor,
    });
  });
  
  return dynamicFields;
};

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  open,
  products,
  onClose,
  onRemove,
}) => {
  // Combine hardcoded fields with dynamic attribute fields
  const allFields = React.useMemo(() => {
    const dynamicFields = getDynamicAttributeFields(products);
    return [...compareFields, ...dynamicFields];
  }, [products]);
  
  // Filter fields to only show those with at least one product having a value
  const visibleFields = React.useMemo(() => {
    return allFields.filter((field) => hasAnyValue(field, products));
  }, [allFields, products]);

  const highlightMap = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    visibleFields.forEach((field) => {
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
  }, [products, visibleFields]);

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
                          {(product.thumbnailUrl || (product.images && product.images.length > 0 && product.images[0])) ? (
                            <img
                              src={product.thumbnailUrl || (product.images?.[0] || '')}
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
                {visibleFields.map((field, fieldIndex) => (
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

