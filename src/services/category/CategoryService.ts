// Category Service for managing categories
export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
}

export interface CategoryListResponse {
  status: number;
  message: string;
  data: Category[];
}

export class CategoryService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  private static readonly API_URL = `${this.API_BASE_URL}/api`;

  /**
   * Lấy danh sách tất cả categories
   */
  static async getCategories(): Promise<CategoryListResponse> {
    try {
      const response = await fetch(`${this.API_URL}/categories`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }
}
