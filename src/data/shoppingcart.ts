// Mock shopping cart data and helpers

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  variant?: string;
  variantId?: string | null; // Variant ID from API (null if no variant)
  type?: 'PRODUCT' | 'COMBO'; // Item type from API
  price: number; // unit price
  originalPrice?: number; // for showing discount
  quantity: number;
  maxQuantity?: number;
  shopName?: string;
  isSelected?: boolean;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  total: number;
  selectedCount: number;
  itemCount: number;
}

export const mockCartItems: CartItem[] = [
  {
    id: 'c1',
    productId: 'p1',
    name: 'Tai nghe Sony WH-1000XM4 Bluetooth Noise Cancelling',
    image: 'https://salt.tikicdn.com/cache/280x280/ts/product/9c/2f/ef/88805db9501847d800ef69758e8e28c7.png.webp',
    variant: 'Đen',
    price: 6990000,
    originalPrice: 8990000,
    quantity: 1,
    maxQuantity: 5,
    shopName: 'Audio Official',
    isSelected: true
  },
  {
    id: 'c2',
    productId: 'p2',
    name: 'Loa JBL Charge 5 Chống Nước IP67 Bản Chính Hãng',
    image: 'https://salt.tikicdn.com/cache/280x280/ts/product/1a/6f/30/af715d16aa6a475f2640a8b2f2600d18.jpg.webp',
    variant: 'Đen than',
    price: 3490000,
    originalPrice: 4590000,
    quantity: 2,
    maxQuantity: 10,
    shopName: 'JBL Flagship',
    isSelected: true
  },
  {
    id: 'c3',
    productId: 'p3',
    name: 'Micro Thu Âm Blue Yeti USB',
    image: 'https://salt.tikicdn.com/cache/280x280/ts/product/05/58/26/5e0281e8deb13d3398fc854079aacee5.jpg.webp',
    variant: 'Silver',
    price: 4490000,
    originalPrice: 5490000,
    quantity: 1,
    maxQuantity: 3,
    shopName: 'Mic Studio',
    isSelected: false
  }
];

export function calcCartSummary(items: CartItem[]): CartSummary {
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const original = items.reduce((acc, it) => acc + (it.originalPrice ?? it.price) * it.quantity, 0);
  const discount = Math.max(0, original - subtotal);
  const selectedCount = items.filter(it => it.isSelected).reduce((acc, it) => acc + it.quantity, 0);
  const total = items.filter(it => it.isSelected).reduce((acc, it) => acc + it.price * it.quantity, 0);
  return { subtotal, discount, total, selectedCount, itemCount };
}

export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}


