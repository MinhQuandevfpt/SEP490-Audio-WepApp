/** Mock Order History Service */
import { dummyOrders } from '../../data/orderHistory';
import type { OrderDetail, OrderStatus } from '../../data/orderHistory';

export class OrderHistoryService {
  static async list(params?: { status?: OrderStatus; search?: string; page?: number; pageSize?: number }): Promise<{ data: OrderDetail[]; total: number }>{
    await new Promise(r => setTimeout(r, 250));
    let data = [...dummyOrders];
    if (params?.status) {
      data = data.filter(o => o.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      data = data.filter(o => o.code.toLowerCase().includes(s));
    }
    const total = data.length;
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { data: data.slice(start, end), total };
  }

  static async getByCode(code: string): Promise<OrderDetail | null> {
    await new Promise(r => setTimeout(r, 200));
    return dummyOrders.find(o => o.code === code) ?? null;
  }
}

export default OrderHistoryService;


