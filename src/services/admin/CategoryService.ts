import type { CategoryListResponse, CategoryItem } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

export class CategoryService {
  static async getCategories(keyword?: string): Promise<CategoryListResponse> {
    const url = new URL(`${API_BASE_URL}/api/categories`);
    if (keyword && keyword.trim()) {
      url.searchParams.set('keyword', keyword.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories (${response.status})`);
    }

    const data = await response.json();
    return data as CategoryListResponse;
  }

  static async getCategoryById(categoryId: string): Promise<CategoryListResponse> {
    const url = `${API_BASE_URL}/api/categories/${categoryId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category detail (${response.status})`);
    }

    const data = await response.json();
    return data as CategoryListResponse; // matches {status,message,data}
  }

  static async createCategory(payload: Omit<CategoryItem, 'categoryId'>): Promise<CategoryListResponse> {
    const url = `${API_BASE_URL}/api/categories`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create category (${response.status})`);
    }

    const data = await response.json();
    return data as CategoryListResponse;
  }

  static async updateCategory(categoryId: string, payload: Omit<CategoryItem, 'categoryId'>): Promise<CategoryListResponse> {
    const url = `${API_BASE_URL}/api/categories/${categoryId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Failed to update category (${response.status})`);
    }
    const data = await response.json();
    return data as CategoryListResponse;
  }

  static async deleteCategory(categoryId: string): Promise<CategoryListResponse> {
    const url = `${API_BASE_URL}/api/categories/${categoryId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': '*/*'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to delete category (${response.status})`);
    }
    const data = await response.json();
    return data as CategoryListResponse;
  }
}

export default CategoryService;

