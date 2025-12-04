import type { ReturnRequestResponse, CustomerAddressApiItem } from '../../types/api';
import { AddressService } from './AddressService';
import { CustomerStoreService } from './StoreService';
import type { StoreDetail } from '../../types/seller';
import { HttpInterceptor } from '../HttpInterceptor';
import type { PackingFormValues } from '../../components/ReturnPackingModal';

export interface ReturnPackingAddresses {
  customerAddressId: string | null;
  storeAddressId: string | null;
}

export class ReturnPackingService {
  static async getDefaultAddressesForReturn(returnRequest: ReturnRequestResponse): Promise<ReturnPackingAddresses> {
    try {
      const [customerAddresses, storeDetail] = await Promise.all([
        AddressService.getAddresses(),
        CustomerStoreService.getStoreDetailWithAddresses(returnRequest.shopId),
      ]);

      const customerAddressId = this.findDefaultCustomerAddressId(customerAddresses);
      const storeAddressId = this.findDefaultStoreAddressId(storeDetail);

      return {
        customerAddressId,
        storeAddressId,
      };
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể tải địa chỉ mặc định cho yêu cầu hoàn trả');
    }
  }

  static async submitPackageInfo(returnId: string, payload: PackingFormValues): Promise<number | null> {
    try {
      const endpoint = `/api/customers/me/returns/${encodeURIComponent(returnId)}/package-info`;

      const response = await HttpInterceptor.post<{ shippingFee?: number }>(
        endpoint,
        {
          weight: payload.weight,
          length: payload.length,
          width: payload.width,
          height: payload.height,
          customerAddressId: payload.customerAddressId,
          storeAddressId: payload.storeAddressId,
        },
        { userType: 'customer' }
      );

      return typeof response?.shippingFee === 'number' ? response.shippingFee : null;
    } catch (error: any) {
      throw new Error(error?.message || 'Không thể xác nhận đóng gói đơn hoàn trả');
    }
  }

  private static findDefaultCustomerAddressId(addresses: CustomerAddressApiItem[]): string | null {
    if (!addresses || addresses.length === 0) return null;
    const defaultAddr = addresses.find((addr) => addr.default) || addresses[0];
    return defaultAddr?.id ?? null;
  }

  private static findDefaultStoreAddressId(storeDetail: StoreDetail): string | null {
    const list = storeDetail.storeAddresses || [];
    if (!list || list.length === 0) return null;
    const defaultAddr = list.find((addr) => addr.defaultAddress) || list[0];
    return defaultAddr?.addressId ?? null;
  }
}

export default ReturnPackingService;


