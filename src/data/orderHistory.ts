// Dummy order history data and helpers

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderSummary {
  code: string; // e.g., #AD123456
  createdAt: string; // ISO
  status: OrderStatus;
  total: number;
}

export interface OrderDetail extends OrderSummary {
  address: {
    fullName: string;
    phone: string;
    fullAddress: string;
  };
  paymentMethod: 'cod' | 'card' | 'paypal' | 'bank_transfer';
  shippingMethod: 'economy' | 'standard' | 'express';
  items: OrderItem[];
  timeline: Array<{ label: string; date: string; done: boolean }>;
}

export const dummyOrders: OrderDetail[] = [
  {
    code: '#AD20241001',
    createdAt: '2025-10-20T08:30:00Z',
    status: 'SHIPPING',
    total: 10480000,
    address: { fullName: 'Nguyen Van A', phone: '0909123456', fullAddress: '123 Nguyen Trai, Quan 1, TP.HCM' },
    paymentMethod: 'cod',
    shippingMethod: 'standard',
    items: [
      { id: 'i1', productId: 'p1', name: 'Tai nghe Sony WH-1000XM4', image: 'https://salt.tikicdn.com/cache/280x280/ts/product/9c/2f/ef/88805db9501847d800ef69758e8e28c7.png.webp', price: 6990000, quantity: 1 },
      { id: 'i2', productId: 'p2', name: 'Loa JBL Charge 5', image: 'https://salt.tikicdn.com/cache/280x280/ts/product/1a/6f/30/af715d16aa6a475f2640a8b2f2600d18.jpg.webp', price: 3490000, quantity: 1 },
    ],
    timeline: [
      { label: 'Đặt hàng', date: '2025-10-20T08:31:00Z', done: true },
      { label: 'Xử lý', date: '2025-10-20T10:00:00Z', done: true },
      { label: 'Đang giao', date: '2025-10-21T07:30:00Z', done: true },
      { label: 'Đã giao', date: '', done: false },
    ],
  },
  {
    code: '#AD20241002',
    createdAt: '2025-10-18T09:00:00Z',
    status: 'DELIVERED',
    total: 3490000,
    address: { fullName: 'Tran Thi B', phone: '0911222333', fullAddress: '456 Le Loi, Quan 3, TP.HCM' },
    paymentMethod: 'card',
    shippingMethod: 'express',
    items: [
      { id: 'i3', productId: 'p3', name: 'Micro Blue Yeti USB', image: 'https://salt.tikicdn.com/cache/280x280/ts/product/05/58/26/5e0281e8deb13d3398fc854079aacee5.jpg.webp', price: 3490000, quantity: 1 },
    ],
    timeline: [
      { label: 'Đặt hàng', date: '2025-10-18T09:01:00Z', done: true },
      { label: 'Xử lý', date: '2025-10-18T10:00:00Z', done: true },
      { label: 'Đang giao', date: '2025-10-18T15:00:00Z', done: true },
      { label: 'Đã giao', date: '2025-10-19T11:30:00Z', done: true },
    ],
  },
  {
    code: '#AD20241003',
    createdAt: '2025-10-15T12:00:00Z',
    status: 'CANCELLED',
    total: 6990000,
    address: { fullName: 'Le Van C', phone: '0909555666', fullAddress: '789 Hai Ba Trung, Quan 1, TP.HCM' },
    paymentMethod: 'bank_transfer',
    shippingMethod: 'economy',
    items: [
      { id: 'i4', productId: 'p4', name: 'Tai nghe Sennheiser HD 560S', image: 'https://salt.tikicdn.com/cache/280x280/ts/product/9c/2f/ef/88805db9501847d800ef69758e8e28c7.png.webp', price: 6990000, quantity: 1 },
    ],
    timeline: [
      { label: 'Đặt hàng', date: '2025-10-15T12:01:00Z', done: true },
      { label: 'Xử lý', date: '2025-10-15T13:00:00Z', done: true },
      { label: 'Hủy đơn', date: '2025-10-15T14:00:00Z', done: true },
      { label: 'Đã giao', date: '', done: false },
    ],
  },
];

export function statusBadgeColor(status: OrderStatus): string {
  switch (status) {
    case 'SHIPPING':
      return 'bg-orange-100 text-orange-700';
    case 'DELIVERED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}


