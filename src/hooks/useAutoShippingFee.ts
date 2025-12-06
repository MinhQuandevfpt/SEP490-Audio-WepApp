import { useEffect, useRef } from 'react';
import type { CartItem } from '../data/shoppingcart';
import type { CustomerAddressApiItem } from '../types/api';
import type { Product } from '../services/customer/ProductListService';

export interface StoreShippingFee {
  storeId: string;
  storeName: string;
  fee: number;
  error?: string;
}

interface UseAutoShippingFeeProps {
  items: CartItem[];
  addresses: CustomerAddressApiItem[];
  selectedAddressId: string | null;
  productCache: Map<string, Product>;
  serviceTypeId: 2 | 5;
  onShippingFeeChange: (fee: number) => void; // Total shipping fee (sum of all stores)
  onStoreShippingFeesChange?: (fees: Record<string, StoreShippingFee>) => void; // Shipping fee per store
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
  onStoreShippingFeesChange,
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
  const onStoreShippingFeesChangeRef = useRef(onStoreShippingFeesChange);
  const onProductCacheUpdateRef = useRef(onProductCacheUpdate);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    addressesRef.current = addresses;
    productCacheRef.current = productCache;
    onShippingFeeChangeRef.current = onShippingFeeChange;
    onStoreShippingFeesChangeRef.current = onStoreShippingFeesChange;
    onProductCacheUpdateRef.current = onProductCacheUpdate;
    onErrorRef.current = onError;
  }, [addresses, productCache, onShippingFeeChange, onStoreShippingFeesChange, onProductCacheUpdate, onError]);

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

        // Ensure to_district_id and to_ward_code are valid
        const toDistrictId = currentAddress.districtId;
        const toWardCode = currentAddress.wardCode;
        if (!toDistrictId || !toWardCode) {
          if (onErrorRef.current) {
            onErrorRef.current('Địa chỉ nhận hàng không đầy đủ thông tin quận/huyện hoặc phường/xã.');
          }
          return;
        }

        // ========== GROUP ITEMS BY STORE ==========
        // Group selected items by storeId
        const itemsByStore = new Map<string, { items: typeof selectedItems; storeName: string }>();
        
        selectedItems.forEach(si => {
          const product = productById.get(si.productId);
          if (!product?.storeId) {
            // Skip items without storeId
            return;
          }
          
          if (!itemsByStore.has(product.storeId)) {
            itemsByStore.set(product.storeId, {
              items: [],
              storeName: product.storeName || `Cửa hàng ${product.storeId.substring(0, 6)}`
            });
          }
          
          itemsByStore.get(product.storeId)!.items.push(si);
        });

        if (itemsByStore.size === 0) {
          // No valid stores found
          if (onErrorRef.current) {
            onErrorRef.current('Không tìm thấy thông tin cửa hàng cho sản phẩm.');
          }
          return;
        }

        // ========== CALCULATE SHIPPING FEE PER STORE ==========
        const storeShippingFees: Record<string, StoreShippingFee> = {};
        let totalShippingFee = 0;
        let hasError = false;

        // Calculate shipping fee for each store
        const storeCalculations = Array.from(itemsByStore.entries()).map(async ([storeId, { items: storeItems, storeName }]) => {
          try {
            // Get origin address from first product of this store
            const firstStoreProduct = productById.get(storeItems[0].productId);
            if (!firstStoreProduct) {
              storeShippingFees[storeId] = {
                storeId,
                storeName,
                fee: 0,
                error: 'Không tìm thấy thông tin sản phẩm'
              };
              hasError = true;
              return;
            }

            const fromDistrictId = firstStoreProduct.districtCode ? Number(firstStoreProduct.districtCode) : NaN;
            const fromWardCode = firstStoreProduct.wardCode || '';
            
            if (!fromWardCode || Number.isNaN(fromDistrictId)) {
              storeShippingFees[storeId] = {
                storeId,
                storeName,
                fee: 0,
                error: 'Thiếu thông tin địa chỉ gửi hàng'
              };
              hasError = true;
              return;
            }

            // Build GHN items for this store
            const ghnItems = storeItems.map(si => {
              const p = productById.get(si.productId);
              const weightKg = (p?.weight && p.weight > 0 ? p.weight : 0.5);
              const weightGr = Math.round(weightKg * 1000);
              return {
                name: si.name,
                quantity: si.quantity,
                length: 1, // Default 1cm
                width: 1,  // Default 1cm
                height: 1, // Default 1cm
                weight: weightGr,
              };
            });

            const pkgWeight = ghnItems.reduce((sum, it) => sum + it.weight * it.quantity, 0);

            // Calculate service type for this store
            const storeServiceTypeId: 2 | 5 = pkgWeight <= 7500 ? 2 : 5;

            // Build request body for this store
            const body = {
              service_type_id: storeServiceTypeId,
              from_district_id: fromDistrictId,
              from_ward_code: fromWardCode,
              to_district_id: Number(toDistrictId),
              to_ward_code: String(toWardCode),
              length: 1,
              width: 1,
              height: 1,
              weight: Number(pkgWeight),
              insurance_value: 0,
              coupon: '',
              items: ghnItems.map(item => ({
                name: String(item.name),
                quantity: Number(item.quantity),
                length: 1,
                width: 1,
                height: 1,
                weight: Number(item.weight),
              })),
            };

            // Call GHN API for this store
            let resp: any;
            try {
              resp = await ShippingService.calculateGhnFee(body);
            } catch (apiError: any) {
              // Handle API error (400, 500, etc.)
              const errorMessage = apiError?.message || apiError?.data?.message || '';
              const errorCode = apiError?.status || apiError?.data?.code;
              const codeMessage = apiError?.data?.code_message || '';
              
              // Check for specific DistrictID validation error
              const isDistrictError = 
                errorCode === 400 &&
                (errorMessage.includes('DistrictID') || 
                 errorMessage.includes('District') ||
                 codeMessage === 'SEND_DISTRICT_IS_INVALID' ||
                 errorMessage.includes('Field validation for \'DistrictID\''));
              
              if (isDistrictError) {
                storeShippingFees[storeId] = {
                  storeId,
                  storeName,
                  fee: 0,
                  error: 'địa chỉ giao nhận có vấn đề từ API(400DB)'
                };
              } else {
                storeShippingFees[storeId] = {
                  storeId,
                  storeName,
                  fee: 0,
                  error: errorMessage || 'Không thể tính phí vận chuyển'
                };
              }
              hasError = true;
              return;
            }

            // Check response
            if (!resp || resp.code !== 200 || !resp.data) {
              // Check for specific DistrictID validation error in response
              const errorMessage = resp?.message || '';
              const codeMessage = resp?.code_message || '';
              
              const isDistrictError = 
                resp?.code === 400 &&
                (errorMessage.includes('DistrictID') || 
                 errorMessage.includes('District') ||
                 codeMessage === 'SEND_DISTRICT_IS_INVALID' ||
                 errorMessage.includes('Field validation for \'DistrictID\''));
              
              if (isDistrictError) {
                storeShippingFees[storeId] = {
                  storeId,
                  storeName,
                  fee: 0,
                  error: 'địa chỉ giao nhận có vấn đề từ API(400DB)'
                };
              } else {
                storeShippingFees[storeId] = {
                  storeId,
                  storeName,
                  fee: 0,
                  error: errorMessage || 'Không thể tính phí vận chuyển'
                };
              }
              hasError = true;
              return;
            }

            if (resp.data.service_fee === undefined || resp.data.service_fee === null) {
              storeShippingFees[storeId] = {
                storeId,
                storeName,
                fee: 0,
                error: 'Không tìm thấy phí vận chuyển trong phản hồi'
              };
              hasError = true;
              return;
            }

            const serviceFee = Number(resp.data.service_fee) || 0;
            storeShippingFees[storeId] = {
              storeId,
              storeName,
              fee: serviceFee
            };
            totalShippingFee += serviceFee;

          } catch (error: any) {
            console.error(`Error calculating shipping fee for store ${storeId}:`, error);
            
            // Check for specific DistrictID validation error
            const errorMessage = error?.message || error?.data?.message || '';
            const errorCode = error?.status || error?.data?.code;
            const codeMessage = error?.data?.code_message || '';
            
            // Check for DistrictID validation error
            const isDistrictError = 
              errorCode === 400 &&
              (errorMessage.includes('DistrictID') || 
               errorMessage.includes('District') ||
               codeMessage === 'SEND_DISTRICT_IS_INVALID' ||
               errorMessage.includes('Field validation for \'DistrictID\'') ||
               errorMessage.includes('DistrictDetailRequest.DistrictID'));
            
            if (isDistrictError) {
              storeShippingFees[storeId] = {
                storeId,
                storeName: itemsByStore.get(storeId)?.storeName || storeId,
                fee: 0,
                error: 'địa chỉ giao nhận có vấn đề từ API(400DB)'
              };
            } else {
              storeShippingFees[storeId] = {
                storeId,
                storeName: itemsByStore.get(storeId)?.storeName || storeId,
                fee: 0,
                error: errorMessage || 'Lỗi tính phí vận chuyển'
              };
            }
            hasError = true;
          }
        });

        // Wait for all store calculations to complete
        await Promise.all(storeCalculations);

        // Update store shipping fees
        if (onStoreShippingFeesChangeRef.current) {
          onStoreShippingFeesChangeRef.current(storeShippingFees);
        }

        // Update total shipping fee
        onShippingFeeChangeRef.current(totalShippingFee);

        // Handle errors
        if (hasError) {
          const errorMessages = Object.values(storeShippingFees)
            .filter(sf => sf.error)
            .map(sf => `${sf.storeName}: ${sf.error}`)
            .join('; ');
          
          if (onErrorRef.current && errorMessages) {
            onErrorRef.current(`Một số cửa hàng không thể tính phí vận chuyển: ${errorMessages}`);
          }
        } else {
          // Clear error on success
          if (onErrorRef.current) {
            onErrorRef.current('');
          }
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
  }, [items, selectedAddressId, serviceTypeId, autoCalculate]); // Include autoCalculate to trigger recalculation when it changes
};

