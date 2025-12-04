import { useState } from 'react';
import { ProductListService, type Product } from '../services/customer/ProductListService';
import { showError } from '../utils/notification';

export interface ComparePreview {
  productId: string;
  name: string;
  image?: string;
  categoryName?: string;
}

export const useProductCompare = () => {
  const [selectedProducts, setSelectedProducts] = useState<ComparePreview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [compareDetails, setCompareDetails] = useState<Product[]>([]);

  const toggleProduct = (product: any) => {
    const productId = product.productId || product.id;
    const image =
      product.image ||
      product.thumbnail ||
      (Array.isArray(product.images) ? product.images[0] : undefined);

    if (!productId) return;

    const isSelected = selectedProducts.some((p) => p.productId === productId);
    if (isSelected) {
      setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
      return;
    }

    if (selectedProducts.length >= 3) {
      showError('Giới hạn', 'Bạn chỉ có thể so sánh tối đa 3 sản phẩm.');
      return;
    }

    if (
      selectedProducts.length > 0 &&
      selectedProducts[0].categoryName &&
      product.categoryName &&
      selectedProducts[0].categoryName !== product.categoryName
    ) {
      showError('Không thể so sánh', 'Chỉ có thể so sánh các sản phẩm cùng danh mục.');
      return;
    }

    setSelectedProducts((prev) => [
      ...prev,
      {
        productId,
        name: product.name,
        image,
        categoryName: product.categoryName,
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
  };
};

export default useProductCompare;

