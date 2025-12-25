import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export interface GhnFeeItem {
  name: string;
  quantity: number;
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // grams
}

export interface GhnFeeRequestBody {
  service_type_id?: 2 | 5; // Optional: 2: Hàng nhẹ, 5: Hàng nặng
  from_district_id?: number; // Optional: Quận/huyện người gửi
  from_ward_code?: string; // Optional: Phường/xã người gửi
  to_district_id: number; // Required: Quận/huyện người nhận
  to_ward_code: string; // Required: Phường/xã người nhận
  length?: number; // Optional: Chiều dài (cm)
  width?: number;  // Optional: Chiều rộng (cm)
  height?: number; // Optional: Chiều cao (cm)
  weight: number; // Required: Khối lượng đơn hàng (gram)
  insurance_value?: number; // Optional: Giá trị bảo hiểm đơn hàng (tối đa 5.000.000)
  coupon?: string | null; // Optional: Mã giảm giá GHN (null if no coupon)
  items: GhnFeeItem[]; // Required: Danh sách sản phẩm (bắt buộc với hàng nặng)
}

export interface GhnFeeResponseData {
  total: number;
  service_fee: number;
  insurance_fee: number;
  pick_station_fee: number;
  coupon_value: number;
  r2s_fee: number;
  return_again: number;
  document_return: number;
  double_check: number;
  cod_fee: number;
  pick_remote_areas_fee: number;
  deliver_remote_areas_fee: number;
  cod_failed_fee: number;
}

export interface GhnFeeResponse {
  code: number;
  message: string;
  data: GhnFeeResponseData;
}

export interface GhnLeadtimeRequest {
  from_district_id: number;
  from_ward_code: string;
  to_district_id: number;
  to_ward_code: string;
  service_id: number; // 53322 for hàng nhẹ, 100039 for hàng nặng
}

export interface GhnLeadtimeResponseData {
  leadtime: number;
  leadtime_order: {
    from_estimate_date: string;
    to_estimate_date: string;
  };
}

export interface GhnLeadtimeResponse {
  code: number;
  message: string;
  data: GhnLeadtimeResponseData;
}

export class ShippingService {
  static async calculateGhnFee(body: GhnFeeRequestBody): Promise<GhnFeeResponse> {
    console.groupCollapsed('🚚 [GHN FEE] POST /api/ghn/fee');
    console.log('Request Body:', body);

    try {
      const response = await HttpInterceptor.post<GhnFeeResponse>(
        `${API_URL}/ghn/fee`,
        body,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          userType: 'customer',
        }
      );

      console.log('Response Body:', response);
      console.groupEnd();

      return response;
    } catch (error) {
      console.error('❌ [GHN FEE] Failed to calculate shipping fee:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Get GHN leadtime (estimated delivery time)
   * POST /api/ghn/leadtime
   */
  static async getGhnLeadtime(body: GhnLeadtimeRequest): Promise<GhnLeadtimeResponse> {
    console.groupCollapsed('⏱️ [GHN LEADTIME] POST /api/ghn/leadtime');
    console.log('Request Body:', body);

    try {
      const response = await HttpInterceptor.post<GhnLeadtimeResponse>(
        `${API_URL}/ghn/leadtime`,
        body,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          userType: 'customer',
        }
      );

      console.log('Response Body:', response);
      console.groupEnd();

      return response;
    } catch (error) {
      console.error('❌ [GHN LEADTIME] Failed to get leadtime:', error);
      console.groupEnd();
      throw error;
    }
  }
}


