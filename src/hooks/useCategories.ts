import { useState, useEffect, useCallback } from 'react';
import { CustomerCategoryService } from '../services/customer/CategoryService';
import type { CategoryItem } from '../types/api';

export interface UseCategoriesReturn {
  categories: CategoryItem[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}

/**
 * Hook for fetching product categories
 */
export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CustomerCategoryService.getAllCategories();
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách danh mục';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
  };
};

export default useCategories;

