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
}: UseAutoShippingFeeProps) => {
  const timeoutRef = useRef<number | null>(null);
  const isCalculatingRef = useRef(false);
  
  // Use refs to store latest values to avoid dependency issues
  const addressesRef = useRef(addresses);
  const productCacheRef = useRef(productCache);
  const onShippingFeeChangeRef = useRef(onShippingFeeChange);
  const onProductCacheUpdateRef = useRef(onProductCacheUpdate);
  
  useEffect(() => {
    addressesRef.current = addresses;
    productCacheRef.current = productCache;
    onShippingFeeChangeRef.current = onShippingFeeChange;
    onProductCacheUpdateRef.current = onProductCacheUpdate;
  }, [addresses, productCache, onShippingFeeChange, onProductCacheUpdate]);

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
          return {
            name: si.name,
            quantity: si.quantity,
            length: 1,
            width: 1,
            height: 1,
            weight: weightGr,
          };
        });

        const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);

        const body = {
          service_type_id: serviceTypeId,
          from_district_id: fromDistrictId,
          from_ward_code: fromWardCode,
          to_district_id: currentAddress.districtId!,
          to_ward_code: currentAddress.wardCode!,
          length: 1,
          width: 1,
          height: 1,
          weight: pkgWeight,
          insurance_value: 0,
          coupon: '',
          items: ghnItems,
        };

        const resp = await ShippingService.calculateGhnFee(body);
        if (resp.code === 200 && resp.data?.total) {
          onShippingFeeChangeRef.current(resp.data.total);
        }
      } catch (error) {
        // Silent fail for auto calculation - don't show error to user
        console.error('Auto shipping fee calculation failed:', error);
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

