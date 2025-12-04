// Dummy data and helpers for Checkout Page

export type ShippingMethod = 'standard' | 'express' | 'economy';
export type PaymentMethod = 'cod' | 'payos';

export interface CheckoutAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

export interface CheckoutCartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  itemType?: 'PRODUCT' | 'COMBO' | string;
  variantId?: string | null;
  comboId?: string | null;
  // Tên biến thể (màu sắc/kích thước...) – map từ variantOptionValue của cart item
  variant?: string | null;
}

export interface CheckoutSummary {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
}

export const dummyAddresses: CheckoutAddress[] = [
  {
    id: 'addr1',
    fullName: 'Nguyen Van A',
    phone: '0909123456',
    street: '123 Nguyen Trai',
    district: 'Quan 1',
    city: 'TP. HCM',
    isDefault: true,
  },
  {
    id: 'addr2',
    fullName: 'Tran Thi B',
    phone: '0911222333',
    street: '456 Le Loi',
    district: 'Quan 3',
    city: 'TP. HCM',
  },
];

export const dummyCartItems: CheckoutCartItem[] = [
  {
    id: 'ci1',
    productId: 'p1',
    name: 'Tai nghe Sony WH-1000XM4',
    image: 'https://salt.tikicdn.com/cache/280x280/ts/product/9c/2f/ef/88805db9501847d800ef69758e8e28c7.png.webp',
    price: 6990000,
    originalPrice: 8990000,
    quantity: 1,
    itemType: 'PRODUCT',
  },
  {
    id: 'ci2',
    productId: 'p2',
    name: 'Loa JBL Charge 5',
    image: 'https://salt.tikicdn.com/cache/280x280/ts/product/1a/6f/30/af715d16aa6a475f2640a8b2f2600d18.jpg.webp',
    price: 3490000,
    originalPrice: 4590000,
    quantity: 2,
    itemType: 'PRODUCT',
  },
];

export function calcCheckoutSummary(items: CheckoutCartItem[], shippingFee: number): CheckoutSummary {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const original = items.reduce((sum, it) => sum + (it.originalPrice ?? it.price) * it.quantity, 0);
  const discount = Math.max(0, original - subtotal);
  const total = subtotal + shippingFee;
  return { subtotal, discount, shippingFee, total };
}

export function formatVnd(v: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}


