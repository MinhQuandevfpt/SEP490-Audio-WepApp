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

    const response = await HttpInterceptor.get<any>(endpoint, { userType: 'seller' });
    const raw: any = response || {};

    const content: ReturnRequestResponse[] = (raw.content || raw.items || []) as ReturnRequestResponse[];

    return {
      data: content,
      total: raw.totalElements ?? content.length ?? 0,
      totalPages: raw.totalPages ?? 0,
      page: raw.page ?? raw.number ?? page,
      size: raw.size ?? size,
    };
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
}

export default StoreReturnService;


