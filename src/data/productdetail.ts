export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  sku?: string;
  price: number;
  salePrice?: number;
  rating: number; // 0-5
  reviewsCount: number;
  soldCount: number;
  images: string[];
  colors?: Array<{ name: string; hex: string }>;
  highlights: string[];
  specs: Array<{ key: string; value: string }>;
  shortDescription?: string;
  description?: string[]; // paragraphs
  warranty?: string;
  shipping?: string;
  inStock: boolean;
}

export const jblFlip6: ProductDetail = {
  id: 'jbl-flip-6',
  name: 'Loa Bluetooth JBL Flip 6 - Pin trâu 12 tiếng, Bluetooth 5.1',
  brand: 'JBL',
  sku: 'JBL-FLIP6-BT',
  price: 2490000,
  salePrice: 2190000,
  rating: 4.8,
  reviewsCount: 3124,
  soldCount: 18000,
  images: [
    'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-maksbhg0jmqf5b@resize_w450_nl.webp',
    'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9s5vnffxg0455.webp',
    'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9s5vnffxg0455.webp',
    'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9s5vnffxg0455.webp'
  ],
  colors: [
    { name: 'Black', hex: '#111111' },
    { name: 'Blue', hex: '#1e3a8a' },
    { name: 'Red', hex: '#b91c1c' }
  ],
  highlights: [
    'Âm thanh mạnh mẽ với JBL Original Pro Sound',
    'Chuẩn chống nước và bụi IP67 - mang đi mọi nơi',
    'Thời lượng pin đến 12 giờ nghe nhạc',
    'Bluetooth 5.1 kết nối ổn định',
    'PartyBoost kết nối 2 loa để tạo hiệu ứng stereo'
  ],
  shortDescription: 'Loa di động bền bỉ với âm thanh JBL Pro mạnh mẽ, chống nước IP67, pin 12 giờ và Bluetooth 5.1 ổn định. Phù hợp dã ngoại, tiệc tùng.',
  description: [
    'JBL Flip 6 mang đến âm thanh mạnh mẽ, sống động với công nghệ JBL Original Pro Sound. Thiết kế nhỏ gọn, bền bỉ, dễ dàng mang theo mọi nơi.',
    'Chuẩn chống nước & bụi IP67 giúp bạn yên tâm sử dụng ngoài trời. Kết nối Bluetooth 5.1 ổn định, hỗ trợ PartyBoost để kết nối 2 loa tạo hiệu ứng stereo.',
  ],
  specs: [
    { key: 'Công suất', value: '30W RMS' },
    { key: 'Chuẩn chống nước', value: 'IP67' },
    { key: 'Kết nối', value: 'Bluetooth 5.1, USB-C' },
    { key: 'Thời lượng pin', value: 'Lên đến 12 giờ' },
    { key: 'Thời gian sạc', value: '2.5 giờ (5V/3A)' },
    { key: 'Kích thước', value: '178 x 68 x 72 mm' },
    { key: 'Trọng lượng', value: '0.55 kg' }
  ],
  warranty: 'Bảo hành chính hãng 12 tháng tại trung tâm JBL',
  shipping: 'Giao nhanh 2h nội thành, miễn phí vận chuyển đơn từ 500k',
  inStock: true
};

export const loadProductDetail = (): ProductDetail => jblFlip6;


