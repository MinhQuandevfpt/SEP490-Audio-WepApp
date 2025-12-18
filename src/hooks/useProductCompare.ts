import { useState } from 'react';
import { ProductListService, type Product } from '../services/customer/ProductListService';
import { showError } from '../utils/notification';

export interface ComparePreview {
  productId: string;
  name: string;
  image?: string;
  thumbnailUrl?: string; // Support new API structure
  categoryId?: string; // Primary: use categoryId for comparison
  categoryName?: string; // Display name
  category?: string; // Support new API structure
}

export const useProductCompare = () => {
  const [selectedProducts, setSelectedProducts] = useState<ComparePreview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [compareDetails, setCompareDetails] = useState<Product[]>([]);

  /**
   * Get category identifier from product (prioritize categoryId)
   */
  const getCategoryIdentifier = (product: any): string | null => {
    // Priority 1: categoryId (most reliable)
    if (product.categoryId) {
      return product.categoryId;
    }
    
    // Priority 2: First category from categories array
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      return product.categories[0].categoryId;
    }
    
    // Priority 3: categoryName (fallback for comparison)
    if (product.categoryName) {
      return product.categoryName;
    }
    
    // Priority 4: category (fallback)
    if (product.category) {
      return product.category;
    }
    
    return null;
  };

  /**
   * Check if two category identifiers match
   */
  const isSameCategory = (cat1: string | null, cat2: string | null): boolean => {
    if (!cat1 || !cat2) return false;
    return cat1 === cat2;
  };

  const toggleProduct = (product: any) => {
    const productId = product.productId || product.id;
    const image =
      product.thumbnailUrl || // New API structure
      product.image ||
      product.thumbnail ||
      (Array.isArray(product.images) ? product.images[0] : undefined);

    if (!productId) return;

    const isSelected = selectedProducts.some((p) => p.productId === productId);
    if (isSelected) {
      setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
      setCompareDetails((prev) => prev.filter((p) => p.productId !== productId));
      return;
    }

    if (selectedProducts.length >= 3) {
      showError('Giới hạn', 'Bạn chỉ có thể so sánh tối đa 3 sản phẩm.');
      return;
    }

    // Get current product's category identifier
    const currentCategoryId = getCategoryIdentifier(product);
    
    // Validate: All products must be in the same category
    if (selectedProducts.length > 0) {
      const firstCategoryId = getCategoryIdentifier(selectedProducts[0]);
      
      if (!isSameCategory(firstCategoryId, currentCategoryId)) {
        showError(
          'Không thể so sánh',
          'Chỉ có thể so sánh các sản phẩm cùng danh mục. Vui lòng chọn sản phẩm cùng danh mục.'
        );
        return;
      }
    }

    // Get category name for display
    const categoryName = 
      product.categoryName || 
      product.category || 
      (product.categories && product.categories.length > 0 ? product.categories[0].categoryName : undefined);

    setSelectedProducts((prev) => [
      ...prev,
      {
        productId,
        name: product.name,
        image,
        thumbnailUrl: product.thumbnailUrl,
        categoryId: currentCategoryId || undefined,
        categoryName: categoryName || undefined,
        category: product.category,
      },
    ]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
    setCompareDetails((prev) => prev.filter((p) => p.productId !== productId));
  };

  const clearAll = () => {
    setSelectedProducts([]);
    setCompareDetails([]);
    setIsModalOpen(false);
  };

  /**
   * Get products in the same category as selected products
   * Useful for suggesting products to compare
   */
  const getProductsInSameCategory = async (categoryId?: string, limit: number = 10): Promise<Product[]> => {
    if (!categoryId) {
      // Try to get categoryId from first selected product
      if (selectedProducts.length === 0) return [];
      const firstProduct = selectedProducts[0];
      if (!firstProduct.categoryId) return [];
      categoryId = firstProduct.categoryId;
    }

    try {
      const response = await ProductListService.getProducts({
        categoryId,
        page: 0,
        size: limit,
        status: 'ACTIVE',
      });

      // Extract products from response
      let products: Product[] = [];
      // Handle direct array response (new API: { status, message, data: Product[] })
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data && 'content' in response.data) {
        // Old pagination structure: { content: Product[], ... }
        products = response.data.content;
      } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        // Nested structure: { data: { data: Product[], page: {...} } }
        products = response.data.data;
      }

      // Filter out already selected products
      const selectedIds = new Set(selectedProducts.map((p) => p.productId));
      return products.filter((p) => !selectedIds.has(p.productId));
    } catch (error) {
      console.error('Failed to get products in same category:', error);
      return [];
    }
  };

  const openCompareModal = async () => {
    if (selectedProducts.length < 2) {
      showError('Thông báo', 'Hãy chọn tối thiểu 2 sản phẩm để so sánh.');
      return;
    }

    try {
      setIsLoadingModal(true);
      const detailPromises = selectedProducts.map((item) =>
        ProductListService.getProductById(item.productId),
      );
      const responses = await Promise.all(detailPromises);
      setCompareDetails(responses.map((res) => res.data));
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load product details for compare:', error);
      showError('Lỗi', error?.message || 'Không thể tải dữ liệu so sánh.');
    } finally {
      setIsLoadingModal(false);
    }
  };

  return {
    selectedProducts,
    compareDetails,
    isModalOpen,
    isLoadingModal,
    toggleProduct,
    removeProduct,
    clearAll,
    openCompareModal,
    closeModal: () => setIsModalOpen(false),
    getProductsInSameCategory,
    getCategoryIdentifier,
    isSameCategory,
  };
};

export default useProductCompare;

