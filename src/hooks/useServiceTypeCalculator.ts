import { useEffect, useState } from 'react';
import { ProductListService, type Product } from '../services/customer/ProductListService';
import type { CartItem } from '../data/shoppingcart';

interface UseServiceTypeCalculatorProps {
  items: CartItem[];
}

export const useServiceTypeCalculator = ({ items }: UseServiceTypeCalculatorProps) => {
  const [serviceTypeId, setServiceTypeId] = useState<2 | 5>(2); // Default: Hàng nhẹ
  const [packageWeight, setPackageWeight] = useState<number>(0); // grams
  const [productCache, setProductCache] = useState<Map<string, Product>>(new Map());

  // Auto-calculate service type ID based on total weight of selected items
  useEffect(() => {
    const calculateServiceType = async () => {
      const selectedItems = items.filter(it => it.isSelected);
      
      if (selectedItems.length === 0) {
        // Reset to default if no items selected
        setServiceTypeId(2);
        setPackageWeight(0);
        return;
      }

      try {
        // Get unique product IDs
        const uniqueProductIds = Array.from(new Set(selectedItems.map(si => si.productId)));
        const productsToFetch = uniqueProductIds.filter(pid => !productCache.has(pid));

        // Fetch missing product details first
        if (productsToFetch.length > 0) {
          const productDetailsArr = await Promise.all(
            productsToFetch.map(async (pid) => {
              try {
                const res = await ProductListService.getProductById(pid);
                return res.data as Product;
              } catch (e) {
                console.error(`Failed to fetch product ${pid}:`, e);
                return null;
              }
            })
          );

          // Update cache with new products
          const newCache = new Map(productCache);
          productDetailsArr.forEach((p) => {
            if (p) {
              newCache.set(p.productId, p);
            }
          });
          setProductCache(newCache);

          // Calculate total weight using the updated cache
          let totalWeight = 0;
          selectedItems.forEach(si => {
            const product = newCache.get(si.productId);
            const weightKg = (product?.weight && product.weight > 0 ? product.weight : 0.5); // Default 0.5kg if not available
            const weightGr = Math.round(weightKg * 1000);
            totalWeight += weightGr * si.quantity;
          });

          // Update package weight
          setPackageWeight(totalWeight);

          // Auto-select service type based on weight
          // ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
          // > 7500 gram → service_type_id = 5 (Hàng nặng)
          if (totalWeight <= 7500) {
            setServiceTypeId(2);
          } else {
            setServiceTypeId(5);
          }
        } else {
          // All products are in cache, calculate directly
          let totalWeight = 0;
          selectedItems.forEach(si => {
            const product = productCache.get(si.productId);
            const weightKg = (product?.weight && product.weight > 0 ? product.weight : 0.5); // Default 0.5kg if not available
            const weightGr = Math.round(weightKg * 1000);
            totalWeight += weightGr * si.quantity;
          });

          // Update package weight
          setPackageWeight(totalWeight);

          // Auto-select service type based on weight
          // ≤ 7500 gram → service_type_id = 2 (Hàng nhẹ)
          // > 7500 gram → service_type_id = 5 (Hàng nặng)
          if (totalWeight <= 7500) {
            setServiceTypeId(2);
          } else {
            setServiceTypeId(5);
          }
        }
      } catch (error) {
        console.error('Failed to calculate service type:', error);
        // Keep current serviceTypeId on error
      }
    };

    calculateServiceType();
  }, [items, productCache]);

  return {
    serviceTypeId,
    setServiceTypeId,
    packageWeight,
    setPackageWeight,
    productCache,
    setProductCache,
  };
};

