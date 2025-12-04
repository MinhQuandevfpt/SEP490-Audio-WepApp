import { useState, useEffect, useCallback } from 'react';
import { PolicyService } from '../services/admin/PolicyService';
import type {
  PolicyItem,
  CreatePolicyItemRequest,
  UpdatePolicyItemRequest,
} from '../types/policy';

interface UsePolicyItemsReturn {
  items: PolicyItem[];
  loading: boolean;
  error: string | null;
  refetch: (categoryId: string) => Promise<void>;
  createItem: (request: CreatePolicyItemRequest) => Promise<PolicyItem>;
  updateItem: (itemId: string, request: UpdatePolicyItemRequest) => Promise<PolicyItem>;
  deleteItem: (itemId: string) => Promise<void>;
}

/**
 * Hook for managing policy items within a category
 */
export const usePolicyItems = (categoryId?: string): UsePolicyItemsReturn => {
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (catId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PolicyService.getItemsByCategory(catId);
      setItems(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch policy items';
      setError(errorMessage);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (categoryId) {
      fetchItems(categoryId);
    }
  }, [categoryId, fetchItems]);

  const createItem = useCallback(async (request: CreatePolicyItemRequest): Promise<PolicyItem> => {
    try {
      const response = await PolicyService.createItem(request);
      if (categoryId) {
        await fetchItems(categoryId); // Refresh list
      }
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      throw err;
    }
  }, [categoryId, fetchItems]);

  const updateItem = useCallback(async (
    itemId: string,
    request: UpdatePolicyItemRequest
  ): Promise<PolicyItem> => {
    try {
      const response = await PolicyService.updateItem(itemId, request);
      if (categoryId) {
        await fetchItems(categoryId); // Refresh list
      }
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
      throw err;
    }
  }, [categoryId, fetchItems]);

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      await PolicyService.deleteItem(itemId);
      if (categoryId) {
        await fetchItems(categoryId); // Refresh list
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      throw err;
    }
  }, [categoryId, fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
