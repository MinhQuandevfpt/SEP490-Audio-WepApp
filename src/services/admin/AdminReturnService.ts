import { HttpInterceptor } from '../HttpInterceptor';
import type { ReturnRequestResponse } from '../../types/api';

export interface AdminReturnDisputesParams {
  page?: number;
  size?: number;
}

export interface AdminReturnDisputesResponse {
  content: ReturnRequestResponse[];
  totalPages: number;
  totalElements: number;
  pageable: {
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ResolveDisputeRequest {
  faultType: 'CUSTOMER' | 'SHOP';
  refundCustomer: boolean;
  adminNote: string;
}

export class AdminReturnService {
  /**
   * Get return disputes (only DISPUTE_ESCALATED status)
   * GET /api/admin/returns/disputes?page=0&size=20
   */
  static async getDisputes(params?: AdminReturnDisputesParams): Promise<AdminReturnDisputesResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.page !== undefined) {
        query.append('page', String(params.page));
      }
      if (params?.size !== undefined) {
        query.append('size', String(params.size));
      }

      const queryString = query.toString();
      const endpoint = `/api/admin/returns/disputes${queryString ? `?${queryString}` : ''}`;

      const response = await HttpInterceptor.get<any>(
        endpoint,
        { userType: 'admin' }
      );

      // API might return wrapped in {status, message, data} or directly
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as AdminReturnDisputesResponse;
      }
      return response as AdminReturnDisputesResponse;
    } catch (error: any) {
      console.error('Error fetching return disputes:', error);
      throw new Error(error?.message || 'Không thể tải danh sách khiếu nại hoàn trả');
    }
  }

  /**
   * Resolve dispute
   * POST /api/admin/returns/{id}/resolve-dispute
   */
  static async resolveDispute(
    returnId: string,
    payload: ResolveDisputeRequest
  ): Promise<ReturnRequestResponse> {
    try {
      const endpoint = `/api/admin/returns/${returnId}/resolve-dispute`;
      const response = await HttpInterceptor.post<ReturnRequestResponse>(
        endpoint,
        payload,
        { userType: 'admin' }
      );

      // API might return wrapped in {status, message, data} or directly
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as ReturnRequestResponse;
      }
      return response as ReturnRequestResponse;
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      throw new Error(error?.message || 'Không thể giải quyết khiếu nại');
    }
  }
}

