import { HttpInterceptor } from '../HttpInterceptor';
import { StoreStaffAuthService } from './AuthStaff';

export interface DeliveryAssignmentItem {
  id: string;
  type: string;
  refId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DeliveryAssignment {
  id: string;
  storeOrderId: string;
  orderStatus: string;
  shipReceiverName: string;
  shipPhoneNumber: string;
  deliveryStaffId: string;
  deliveryStaffName: string;
  preparedById: string;
  preparedByName: string;
  assignedAt: string;
  pickUpAt: string | null;
  deliveredAt: string | null;
  note: string | null;
  orderTotal: number;
  items: DeliveryAssignmentItem[];
}

export interface GetStaffOrdersParams {
  page?: number;
  size?: number;
  status?: string;
  sort?: string;
}

export interface GetStaffOrdersResponse {
  content: DeliveryAssignment[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export class StaffOrderService {
  static getStoreId(): string | null {
    const user = StoreStaffAuthService.getCurrentUser();
    return user?.store_id || null;
  }

  static getStaffId(): string | null {
    const user = StoreStaffAuthService.getCurrentUser();
    return user?.staff_id || null;
  }

  static async getOrders(params: GetStaffOrdersParams = {}): Promise<GetStaffOrdersResponse> {
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const sort = params.sort || 'assignedAt';
    const storeId = this.getStoreId();
    const staffId = this.getStaffId();
    
    if (!storeId) throw new Error('Không tìm thấy storeId trong thông tin đăng nhập nhân viên');
    if (!staffId) throw new Error('Không tìm thấy staffId trong thông tin đăng nhập nhân viên');

    // API endpoint: /api/v1/stores/{storeId}/orders/delivery/staff/{staffId}/assignments/page
    let endpoint = `/api/v1/stores/${storeId}/orders/{storeOrderId}/delivery/staff/${staffId}/assignments/page?page=${page}&size=${size}&sort=${sort}`;
    
    if (params.status) {
      endpoint += `&status=${params.status}`;
    }

    const response = await HttpInterceptor.get<any>(endpoint, { userType: 'staff' });
    
    // Transform response to match expected format
    return {
      content: response.content || [],
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 0,
      page: response.number || page,
      size: response.size || size,
      number: response.number || page,
      first: response.first ?? true,
      last: response.last ?? true,
      empty: response.empty ?? false,
    };
  }

  static async markAsReadyForDelivery(storeOrderId: string): Promise<any> {
    const storeId = this.getStoreId();
    if (!storeId) throw new Error('Không tìm thấy storeId trong thông tin đăng nhập nhân viên');

    const endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/delivery/ready`;
    return HttpInterceptor.post<any>(endpoint, {}, { userType: 'staff' });
  }

  static async markAsOutForDelivery(storeOrderId: string): Promise<any> {
    const storeId = this.getStoreId();
    if (!storeId) throw new Error('Không tìm thấy storeId trong thông tin đăng nhập nhân viên');

    const endpoint = `/api/v1/stores/${storeId}/orders/${storeOrderId}/delivery/out-for-delivery`;
    return HttpInterceptor.post<any>(endpoint, {}, { userType: 'staff' });
  }
}

export default StaffOrderService;


