import { HttpInterceptor } from '../HttpInterceptor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
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
  service_type_id: 2 | 5;
  from_district_id: number;
  from_ward_code: string;
  to_district_id: number;
  to_ward_code: string;
  length: number; // cm (package)
  width: number;  // cm (package)
  height: number; // cm (package)
  weight: number; // grams (package)
  insurance_value: number; // 0..5_000_000
  coupon: string; // default ""
  items: GhnFeeItem[];
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

export class ShippingService {
  static async calculateGhnFee(body: GhnFeeRequestBody): Promise<GhnFeeResponse> {
    return HttpInterceptor.post<GhnFeeResponse>(`${API_URL}/ghn/fee`, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      userType: 'customer',
    });
  }
}


