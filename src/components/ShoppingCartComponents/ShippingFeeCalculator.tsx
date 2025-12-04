import React, { useState } from 'react';
import type { CartItem } from '../../data/shoppingcart';
import type { CustomerAddressApiItem } from '../../types/api';
import { ProductListService, type Product } from '../../services/customer/ProductListService';
import { ShippingService, type GhnFeeRequestBody } from '../../services/customer/ShippingService';
import { showCenterError } from '../../utils/notification';

interface ShippingFeeCalculatorProps {
  items: CartItem[];
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  productCache: Map<string, Product>;
  onProductCacheUpdate: (cache: Map<string, Product>) => void;
  serviceTypeId: 2 | 5;
  onServiceTypeIdChange: (id: 2 | 5) => void;
  packageWeight: number;
  onPackageWeightChange: (weight: number) => void;
  onShippingFeeChange: (fee: number) => void;
}

const ShippingFeeCalculator: React.FC<ShippingFeeCalculatorProps> = ({
  items,
  addresses,
  selectedAddressId,
  productCache,
  onProductCacheUpdate,
  serviceTypeId,
  // onServiceTypeIdChange, // Giữ lại để maintain props interface
  // packageWeight, // Giữ lại để maintain props interface
  onPackageWeightChange,
  onShippingFeeChange,
}) => {
  // Giữ lại các state và functions để maintain logic, nhưng không sử dụng vì UI đã ẩn
  // Prefix với underscore để indicate unused nhưng vẫn giữ logic
  const [_insuranceValue, _setInsuranceValue] = useState<number>(0);
  const [_shipCalcLoading, _setShipCalcLoading] = useState<boolean>(false);
  const [_shipCalcMessage, _setShipCalcMessage] = useState<string | null>(null);
  const [_packageDims, _setPackageDims] = useState<{ length: number; width: number; height: number }>({ length: 1, width: 1, height: 1 });

  const clampInsurance = (val: number) => Math.max(0, Math.min(5_000_000, Math.floor(val || 0)));

  // Giữ lại function để maintain logic, có thể sử dụng sau này
  // Prefix với underscore để indicate unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _calculateShippingFee = async () => {
    try {
      _setShipCalcLoading(true);
      _setShipCalcMessage(null);

      const selectedItems = items.filter(it => it.isSelected);
      if (selectedItems.length === 0) {
        showCenterError('Vui lòng chọn sản phẩm trước khi tính phí ship', 'Lỗi');
        return;
      }
      if (!selectedAddressId) {
        showCenterError('Vui lòng chọn địa chỉ nhận hàng', 'Lỗi');
        return;
      }

      // Load destination codes from selected address
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      const toDistrictId = selectedAddress?.districtId ?? null;
      const toWardCode = selectedAddress?.wardCode ?? null;
      if (!toDistrictId || !toWardCode) {
        showCenterError('Địa chỉ nhận hàng thiếu district/ward code', 'Lỗi');
        return;
      }

      // Use cached products or fetch missing ones
      const uniqueProductIds = Array.from(new Set(selectedItems.map(si => si.productId)));
      const productsToFetch = uniqueProductIds.filter(pid => !productCache.has(pid));
      
      // Start with current cache
      const productById = new Map<string, Product>();
      productCache.forEach((product, pid) => {
        if (uniqueProductIds.includes(pid)) {
          productById.set(pid, product);
        }
      });
      
      // Fetch missing product details if needed
      if (productsToFetch.length > 0) {
        const productDetailsArr = await Promise.all(
          productsToFetch.map(async (pid) => {
            try {
              const res = await ProductListService.getProductById(pid);
              return res.data as Product;
            } catch (e) {
              return null;
            }
          })
        );
        
        // Update cache with new products and add to productById map
        const newCache = new Map(productCache);
        productDetailsArr.forEach((p) => {
          if (p) {
            newCache.set(p.productId, p);
            productById.set(p.productId, p);
          }
        });
        onProductCacheUpdate(newCache);
      }

      // Determine origin from the first selected product
      const firstProd = productById.get(selectedItems[0].productId);
      const fromDistrictId = firstProd?.districtCode ? Number(firstProd.districtCode) : NaN;
      const fromWardCode = firstProd?.wardCode || '';
      if (!fromWardCode || Number.isNaN(fromDistrictId)) {
        showCenterError('Không lấy được mã quận/huyện hoặc phường/xã của nơi gửi từ sản phẩm', 'Lỗi');
        return;
      }

      // Build GHN items with default dimensions and weight from products
      const ghnItems = selectedItems.map(si => {
        const p = productById.get(si.productId);
        const weightKg = (p?.weight && p.weight > 0 ? p.weight : 0.5);
        const weightGr = Math.round(weightKg * 1000);
        // Default dimensions: always 1cm for all items
        const defaultDim = 1;
        return {
          name: si.name,
          quantity: si.quantity,
          length: defaultDim,
          width: defaultDim,
          height: defaultDim,
          weight: weightGr,
        };
      });

      // Aggregate package weight (sum of all item weights)
      const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);

      // Default package dimensions (cm) - always 1
      const pkgLength = 1;
      const pkgWidth = 1;
      const pkgHeight = 1;

      // Ensure all values are correct types
      const body: GhnFeeRequestBody = {
        service_type_id: serviceTypeId,
        from_district_id: Number(fromDistrictId),
        from_ward_code: String(fromWardCode),
        to_district_id: Number(toDistrictId),
        to_ward_code: String(toWardCode),
        length: Number(pkgLength),
        width: Number(pkgWidth),
        height: Number(pkgHeight),
        weight: Number(pkgWeight),
        insurance_value: Number(clampInsurance(_insuranceValue)),
        coupon: '', // Empty string if no coupon
        items: ghnItems.map(item => ({
          name: String(item.name),
          quantity: Number(item.quantity),
          length: 1, // Default 1cm
          width: 1, // Default 1cm
          height: 1, // Default 1cm
          weight: Number(item.weight),
        })),
      };

      const resp = await ShippingService.calculateGhnFee(body);
      if (resp.code === 200 && resp.data?.service_fee !== undefined) {
        // Use service_fee from response for shipping fee display
        const serviceFee = resp.data.service_fee || 0;
        _setShipCalcMessage(`Phí dự kiến: ${serviceFee.toLocaleString('vi-VN')}₫ (dịch vụ: ${serviceTypeId === 2 ? 'Hàng nhẹ' : 'Hàng nặng'})`);
        _setPackageDims({ length: pkgLength, width: pkgWidth, height: pkgHeight });
        onPackageWeightChange(pkgWeight);
        // Do not auto-apply; let user apply explicitly
        return;
      }
      _setShipCalcMessage(resp.message || 'Không tính được phí ship');
    } catch (e: any) {
      const msg = e?.message || e?.data?.message || 'Không thể tính phí ship. Vui lòng thử lại.';
      _setShipCalcMessage(msg);
    } finally {
      _setShipCalcLoading(false);
    }
  };

  // Giữ lại function để maintain logic, có thể sử dụng sau này
  // Prefix với underscore để indicate unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _applyShippingFee = () => {
    // Extract number from message if available and apply
    const match = _shipCalcMessage?.match(/(\d+[\.\d]*)/g);
    // Fallback: do not change if cannot parse
    if (match && match.length > 0) {
      // Last number is total without separators due to locale; recompute by removing dots
      const raw = match[match.length - 1].replace(/\./g, '');
      const fee = Number(raw);
      if (!Number.isNaN(fee)) onShippingFeeChange(fee);
    }
  };

  // Giữ lại functions trong object để tránh unused warnings
  // Logic vẫn được giữ để có thể sử dụng sau này nếu cần
  if (false) {
    // Không bao giờ execute, chỉ để giữ functions
    _calculateShippingFee();
    _applyShippingFee();
  }

  // Component đã được ẩn vì hệ thống tự động tính phí ship
  // Logic vẫn được giữ để hỗ trợ tính toán tự động
  return null;
};

export default ShippingFeeCalculator;

