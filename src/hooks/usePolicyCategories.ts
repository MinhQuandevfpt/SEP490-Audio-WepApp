import { useState, useEffect, useCallback } from 'react';
import { PolicyService } from '../services/admin/PolicyService';
import type {
  PolicyCategory,
  CreatePolicyCategoryRequest,
  UpdatePolicyCategoryRequest,
} from '../types/policy';

interface UsePolicyCategoriesReturn {
  categories: PolicyCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCategory: (request: CreatePolicyCategoryRequest) => Promise<PolicyCategory>;
  updateCategory: (categoryId: string, request: UpdatePolicyCategoryRequest) => Promise<PolicyCategory>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

/**
 * Hook for managing policy categories
 */
export const usePolicyCategories = (): UsePolicyCategoriesReturn => {
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await PolicyService.getCategories();
      setCategories(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch policy categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (request: CreatePolicyCategoryRequest): Promise<PolicyCategory> => {
    try {
      const response = await PolicyService.createCategory(request);
      await fetchCategories(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      throw err;
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (
    categoryId: string,
    request: UpdatePolicyCategoryRequest
  ): Promise<PolicyCategory> => {
    try {
      const response = await PolicyService.updateCategory(categoryId, request);
      await fetchCategories(); // Refresh list
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      throw err;
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    try {
      await PolicyService.deleteCategory(categoryId);
      await fetchCategories(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      throw err;
    }
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
