import { HttpInterceptor } from '../HttpInterceptor';
import { StoreStaffAuthService } from './AuthStaff';
import type { StoreOrder } from '../../types/seller';

export interface GetStaffOrdersParams {
  page?: number;
  size?: number;
}

export interface GetStaffOrdersResponse {
  items: StoreOrder[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export class StaffOrderService {
  static getStoreId(): string | null {
    const user = StoreStaffAuthService.getCurrentUser();
    return user?.store_id || null;
  }

  static async getOrders(params: GetStaffOrdersParams = {}): Promise<GetStaffOrdersResponse> {
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const storeId = this.getStoreId();
    if (!storeId) throw new Error('Không tìm thấy storeId trong thông tin đăng nhập nhân viên');

    const endpoint = `/api/v1/stores/${storeId}/orders?page=${page}&size=${size}`;
    return HttpInterceptor.get<GetStaffOrdersResponse>(endpoint, { userType: 'staff' });
  }
}

export default StaffOrderService;


