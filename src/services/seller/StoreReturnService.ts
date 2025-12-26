import { HttpInterceptor } from '../HttpInterceptor';
import type { ReturnRequestResponse } from '../../types/api';

export interface StoreReturnListParams {
  page?: number;
  size?: number;
}

export interface StoreReturnListResult {
  data: ReturnRequestResponse[];
  total: number;
  totalPages: number;
  page: number;
  size: number;
}

export class StoreReturnService {
  static async list(params?: StoreReturnListParams): Promise<StoreReturnListResult> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;

    const query = new URLSearchParams();
    query.append('page', String(page));
    query.append('size', String(size));

    const endpoint = `/api/store/returns?${query.toString()}`;

    console.log('🔍 [StoreReturnService] Fetching returns list:', {
      endpoint,
      page,
      size,
    });

    try {
      const response = await HttpInterceptor.get<any>(endpoint, { userType: 'seller' });
      const raw: any = response || {};

      console.log('✅ [StoreReturnService] API Response:', {
        hasContent: !!raw.content,
        contentLength: raw.content?.length || 0,
        totalElements: raw.totalElements,
        totalPages: raw.totalPages,
        number: raw.number,
        size: raw.size,
      });

      // Parse Spring Page format: { content: [], totalElements: number, totalPages: number, number: number, size: number }
      const content: ReturnRequestResponse[] = (raw.content || raw.items || []) as ReturnRequestResponse[];

      const result: StoreReturnListResult = {
        data: content,
        total: raw.totalElements ?? content.length ?? 0,
        totalPages: raw.totalPages ?? 0,
        page: raw.number ?? raw.page ?? page,
        size: raw.size ?? size,
      };

      console.log('📦 [StoreReturnService] Parsed result:', {
        dataCount: result.data.length,
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        size: result.size,
      });

      return result;
    } catch (error: any) {
      console.error('❌ [StoreReturnService] Error fetching returns list:', error);
      throw error;
    }
  }

  static async approve(id: string): Promise<void> {
    try {
      const endpoint = `/api/store/returns/${id}/approve`;
      await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'seller' });
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể duyệt yêu cầu hoàn trả');
    }
  }

  static async createGhnOrder(id: string, pickShiftId: number): Promise<ReturnRequestResponse> {
    try {
      const endpoint = `/api/store/returns/${id}/create-ghn-order`;
      const response = await HttpInterceptor.post<ReturnRequestResponse>(
        endpoint,
        { pickShiftId },
        { userType: 'seller' }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể tạo đơn GHN');
    }
  }

  static async reject(id: string, shopRejectReason: string): Promise<void> {
    try {
      const endpoint = `/api/store/returns/${id}/reject`;
      await HttpInterceptor.post<void>(
        endpoint,
        { shopRejectReason },
        { userType: 'seller' }
      );
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể từ chối yêu cầu hoàn trả');
    }
  }

  /**
   * Refund without requiring return shipment
   */
  static async refundWithoutReturn(id: string): Promise<void> {
    try {
      const endpoint = `/api/store/returns/${id}/refund-without-return`;
      await HttpInterceptor.post<void>(endpoint, undefined, { userType: 'seller' });
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể hoàn tiền không cần trả hàng');
    }
  }

  /**
   * Escalate dispute to admin
   * POST /api/store/returns/{id}/dispute
   */
  static async dispute(
    id: string,
    payload: {
      reason: string;
      videoUrl?: string;
      imageUrls?: string[];
    }
  ): Promise<ReturnRequestResponse> {
    try {
      const endpoint = `/api/store/returns/${id}/dispute`;
      const response = await HttpInterceptor.post<ReturnRequestResponse>(
        endpoint,
        payload,
        { userType: 'seller' }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể khiếu nại yêu cầu hoàn trả');
    }
  }

  /**
   * Shop confirms received goods for DELIVERED status
   * POST /api/store/returns/{id}/shop-confirm-received
   */
  static async shopConfirmReceived(id: string): Promise<ReturnRequestResponse> {
    try {
      const endpoint = `/api/store/returns/${id}/shop-confirm-received`;
      const response = await HttpInterceptor.post<ReturnRequestResponse>(
        endpoint,
        undefined,
        { userType: 'seller' }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể xác nhận đã nhận hàng');
    }
  }
}

export default StoreReturnService;


