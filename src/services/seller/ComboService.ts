import HttpInterceptor from '../HttpInterceptor';
import type {
  CreateComboRequest,
  CreateComboResponse,
  Combo,
  ComboListResponse,
  ComboQueryParams,
} from '../../types/seller';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_BASE_URL = BASE_URL.endsWith('/api') ? `${BASE_URL}/v1/combos/shop` : `${BASE_URL}/api/v1/combos/shop`;

/**
 * Service for managing shop combos
 */
export class ComboService {
  /**
   * Create a new combo for the shop
   * @param request - Combo creation data
   * @returns Created combo response
   */
  static async createCombo(request: CreateComboRequest): Promise<CreateComboResponse> {
    try {
      const response = await HttpInterceptor.fetch<CreateComboResponse>(
        API_BASE_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          userType: 'seller',
        }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get list of shop combos with pagination and filters
   * @param params - Query parameters (page, size, keyword, isActive)
   * @returns List of combos
   */
  static async getCombos(params: ComboQueryParams = {}): Promise<ComboListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.size !== undefined) {
        queryParams.append('size', params.size.toString());
      }
      
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      
      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }

      const url = `${API_BASE_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await HttpInterceptor.fetch<ComboListResponse>(url, {
        method: 'GET',
        userType: 'seller',
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  static async getComboById(comboId: string): Promise<Combo> {
    try {
      const response = await HttpInterceptor.fetch<{ status: number; message: string; data: Combo }>(
        `${API_BASE_URL}/${comboId}`,
        {
          method: 'GET',
          userType: 'seller',
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateComboStatus(comboId: string, isActive: boolean): Promise<Combo> {
    try {
      const response = await HttpInterceptor.fetch<{ status: number; message: string; data: Combo }>(
        `${API_BASE_URL}/${comboId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
          userType: 'seller',
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteCombo(comboId: string): Promise<void> {
    try {
      await HttpInterceptor.fetch(
        `${API_BASE_URL}/${comboId}`,
        {
          method: 'DELETE',
          userType: 'seller',
        }
      );
    } catch (error) {
      throw error;
    }
  }
}
