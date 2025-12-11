import HttpInterceptor from '../HttpInterceptor';
import type {
  CreatePolicyCategoryRequest,
  UpdatePolicyCategoryRequest,
  CreatePolicyItemRequest,
  UpdatePolicyItemRequest,
  PolicyCategoryResponse,
  PolicyCategoriesResponse,
  PolicyItemResponse,
  PolicyItemsResponse,
} from '../../types/policy';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_BASE_URL = BASE_URL.endsWith('/api') ? `${BASE_URL}/policies` : `${BASE_URL}/api/policies`;

/**
 * Service for managing policy categories and items
 */
export class PolicyService {
  /**
   * Get all policy categories
   * @returns List of policy categories
   */
  static async getCategories(): Promise<PolicyCategoriesResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyCategoriesResponse>(
        `${API_BASE_URL}/categories`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching policy categories:', error);
      throw error;
    }
  }

  /**
   * Get a single policy category by ID
   * @param categoryId - UUID of the category
   * @returns Policy category details
   */
  static async getCategoryById(categoryId: string): Promise<PolicyCategoryResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyCategoryResponse>(
        `${API_BASE_URL}/categories/${categoryId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    } catch (error) {
      console.error(`Error fetching policy category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new policy category
   * @param request - Category creation data
   * @returns Created category
   */
  static async createCategory(request: CreatePolicyCategoryRequest): Promise<PolicyCategoryResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyCategoryResponse>(
        `${API_BASE_URL}/categories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          userType: 'admin',
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating policy category:', error);
      throw error;
    }
  }

  /**
   * Update an existing policy category
   * @param categoryId - UUID of the category to update
   * @param request - Update data
   * @returns Updated category
   */
  static async updateCategory(
    categoryId: string,
    request: UpdatePolicyCategoryRequest
  ): Promise<PolicyCategoryResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyCategoryResponse>(
        `${API_BASE_URL}/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          userType: 'admin',
        }
      );
      return response;
    } catch (error) {
      console.error(`Error updating policy category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a policy category
   * @param categoryId - UUID of the category to delete
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      await HttpInterceptor.fetch<void>(
        `${API_BASE_URL}/categories/${categoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          userType: 'admin',
        }
      );
    } catch (error) {
      console.error(`Error deleting policy category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get all policy items for a specific category
   * @param categoryId - UUID of the category
   * @returns List of policy items
   */
  static async getItemsByCategory(categoryId: string): Promise<PolicyItemsResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyItemsResponse>(
        `${API_BASE_URL}/categories/${categoryId}/items`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    } catch (error) {
      console.error(`Error fetching items for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single policy item by ID
   * @param itemId - UUID of the item
   * @returns Policy item details
   */
  static async getItemById(itemId: string): Promise<PolicyItemResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyItemResponse>(
        `${API_BASE_URL}/items/${itemId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    } catch (error) {
      console.error(`Error fetching policy item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new policy item
   * @param request - Item creation data
   * @returns Created item
   */
  static async createItem(request: CreatePolicyItemRequest): Promise<PolicyItemResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyItemResponse>(
        `${API_BASE_URL}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          userType: 'admin',
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating policy item:', error);
      throw error;
    }
  }

  /**
   * Update an existing policy item
   * @param itemId - UUID of the item to update
   * @param request - Update data
   * @returns Updated item
   */
  static async updateItem(
    itemId: string,
    request: UpdatePolicyItemRequest
  ): Promise<PolicyItemResponse> {
    try {
      const response = await HttpInterceptor.fetch<PolicyItemResponse>(
        `${API_BASE_URL}/items/${itemId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          userType: 'admin',
        }
      );
      return response;
    } catch (error) {
      console.error(`Error updating policy item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a policy item
   * @param itemId - UUID of the item to delete
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      await HttpInterceptor.fetch<void>(
        `${API_BASE_URL}/items/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          userType: 'admin',
        }
      );
    } catch (error) {
      console.error(`Error deleting policy item ${itemId}:`, error);
      throw error;
    }
  }
}
