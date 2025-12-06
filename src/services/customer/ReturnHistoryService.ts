import { HttpInterceptor } from '../HttpInterceptor';
import type { ReturnRequestResponse } from '../../types/api';

export interface CustomerReturnListParams {
  page?: number;
  size?: number;
}

export interface CustomerReturnListResult {
  data: ReturnRequestResponse[];
  total: number;
  totalPages: number;
  page: number;
  size: number;
}

export class ReturnHistoryService {
  static async list(params?: CustomerReturnListParams): Promise<CustomerReturnListResult> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;

    const query = new URLSearchParams();
    query.append('page', String(page));
    query.append('size', String(size));

    const endpoint = `/api/customers/me/returns?${query.toString()}`;

    const response = await HttpInterceptor.get<any>(endpoint, { userType: 'customer' });
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
}

export default ReturnHistoryService;


