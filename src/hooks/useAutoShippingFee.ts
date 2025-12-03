import { useEffect, useRef } from 'react';
import type { CartItem } from '../data/shoppingcart';
import type { CustomerAddressApiItem } from '../types/api';
import type { Product } from '../services/customer/ProductListService';

interface UseAutoShippingFeeProps {
  items: CartItem[];
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  productCache: Map<string, Product>;
  serviceTypeId: 2 | 5;
  onShippingFeeChange: (fee: number) => void;
  onProductCacheUpdate: (cache: Map<string, Product>) => void;
  autoCalculate?: boolean; // Enable/disable auto calculation
  onError?: (message: string) => void; // Optional error handler
}

export const useAutoShippingFee = ({
  items,
  addresses,
  selectedAddressId,
  productCache,
  serviceTypeId,
  onShippingFeeChange,
  onProductCacheUpdate,
  autoCalculate = true,
  onError,
}: UseAutoShippingFeeProps) => {
  const timeoutRef = useRef<number | null>(null);
  const isCalculatingRef = useRef(false);
  
  // Use refs to store latest values to avoid dependency issues
  const addressesRef = useRef(addresses);
  const productCacheRef = useRef(productCache);
  const onShippingFeeChangeRef = useRef(onShippingFeeChange);
  const onProductCacheUpdateRef = useRef(onProductCacheUpdate);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    addressesRef.current = addresses;
    productCacheRef.current = productCache;
    onShippingFeeChangeRef.current = onShippingFeeChange;
    onProductCacheUpdateRef.current = onProductCacheUpdate;
    onErrorRef.current = onError;
  }, [addresses, productCache, onShippingFeeChange, onProductCacheUpdate, onError]);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't auto calculate if disabled
    if (!autoCalculate) return;

    // Check if we have enough info to calculate
    const selectedItems = items.filter(it => it.isSelected);
    if (selectedItems.length === 0 || !selectedAddressId) {
      return;
    }

    // Use latest addresses from ref
    const currentAddresses = addressesRef.current;
    const selectedAddress = currentAddresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress?.districtId || !selectedAddress?.wardCode) {
      return;
    }

    // Debounce calculation to avoid too many API calls
    timeoutRef.current = window.setTimeout(async () => {
      if (isCalculatingRef.current) return; // Prevent concurrent calculations
      
      try {
        isCalculatingRef.current = true;

        // Import services
        const { ProductListService } = await import('../services/customer/ProductListService');
        const { ShippingService } = await import('../services/customer/ShippingService');

        // Use latest cache from ref
        const currentCache = productCacheRef.current;
        const currentAddresses = addressesRef.current;
        const currentAddress = currentAddresses.find(a => a.id === selectedAddressId);
        if (!currentAddress) {
          return;
        }

        // Use cached products or fetch missing ones
        const uniqueProductIds = Array.from(new Set(selectedItems.map(si => si.productId)));
        const productsToFetch = uniqueProductIds.filter(pid => !currentCache.has(pid));
        
        // Start with current cache
        const productById = new Map<string, Product>();
        currentCache.forEach((product, pid) => {
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
          
          // Update cache with new products
          const newCache = new Map(currentCache);
          productDetailsArr.forEach((p) => {
            if (p) {
              newCache.set(p.productId, p);
              productById.set(p.productId, p);
            }
          });
          onProductCacheUpdateRef.current(newCache);
        }

        // Determine origin from the first selected product
        const firstProd = productById.get(selectedItems[0].productId);
        const fromDistrictId = firstProd?.districtCode ? Number(firstProd.districtCode) : NaN;
        const fromWardCode = firstProd?.wardCode || '';
        if (!fromWardCode || Number.isNaN(fromDistrictId)) {
          return; // Silent fail for auto calculation
        }

        // Build GHN items
        const ghnItems = selectedItems.map(si => {
          const p = productById.get(si.productId);
          const weightKg = (p?.weight && p.weight > 0 ? p.weight : 0.5);
          const weightGr = Math.round(weightKg * 1000);
          // Luôn sử dụng kích thước mặc định 1x1x1 (cm) cho mọi sản phẩm
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

        const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);

        // Ensure to_district_id and to_ward_code are valid
        const toDistrictId = currentAddress.districtId;
        const toWardCode = currentAddress.wardCode;
        if (!toDistrictId || !toWardCode) {
          if (onErrorRef.current) {
            onErrorRef.current('Địa chỉ nhận hàng không đầy đủ thông tin quận/huyện hoặc phường/xã.');
          }
          return;
        }

        // Build request body with all required fields
        const body = {
          service_type_id: serviceTypeId,
          from_district_id: fromDistrictId,
          from_ward_code: fromWardCode,
          to_district_id: Number(toDistrictId), // Ensure it's a number
          to_ward_code: String(toWardCode), // Ensure it's a string
          length: 30, // Default package dimensions (cm)
          width: 40, // Default package dimensions (cm)
          height: 20, // Default package dimensions (cm)
          weight: Number(pkgWeight), // Ensure it's a number (grams)
          insurance_value: 0, // Default insurance value
          coupon: '', // Empty string if no coupon
          items: ghnItems.map(item => ({
            name: String(item.name),
            quantity: Number(item.quantity),
            length: Number(item.length),
            width: Number(item.width),
            height: Number(item.height),
            weight: Number(item.weight),
          })),
        };

        const resp = await ShippingService.calculateGhnFee(body);

        // Check if response is valid
        if (!resp) {
          if (onErrorRef.current) {
            onErrorRef.current('Không nhận được phản hồi từ API. Vui lòng thử lại.');
          }
          return;
        }

        // Check if response code is 200
        if (resp.code !== 200) {
          if (onErrorRef.current) {
            onErrorRef.current(resp.message || 'Không thể tính phí vận chuyển. Vui lòng thử lại hoặc kiểm tra lại địa chỉ.');
          }
          return;
        }

        // Check if data exists
        if (!resp.data) {
          if (onErrorRef.current) {
            onErrorRef.current('Phản hồi từ API không hợp lệ. Vui lòng thử lại.');
          }
          return;
        }

        // Check if service_fee exists (can be 0, so check for undefined/null)
        if (resp.data.service_fee === undefined || resp.data.service_fee === null) {
          if (onErrorRef.current) {
            onErrorRef.current('Không tìm thấy phí vận chuyển trong phản hồi. Vui lòng thử lại.');
          }
          return;
        }

        // Use service_fee from response for shipping fee
        const serviceFee = Number(resp.data.service_fee) || 0;
        onShippingFeeChangeRef.current(serviceFee);
        // Clear previous error on success
        if (onErrorRef.current) {
          onErrorRef.current('');
        }
      } catch (error) {
        console.error('Auto shipping fee calculation failed:', error);
        if (onErrorRef.current) {
          onErrorRef.current('Không thể tính phí vận chuyển. Vui lòng thử lại hoặc kiểm tra lại địa chỉ.');
        }
      } finally {
        isCalculatingRef.current = false;
      }
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedAddressId, serviceTypeId]); // Only depend on values that change, not functions
};

