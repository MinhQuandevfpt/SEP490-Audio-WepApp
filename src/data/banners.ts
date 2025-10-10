export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  backgroundColor: string;
}

export const banners: Banner[] = [
  {
    id: '1',
    title: 'Flash Sale 12.12',
    subtitle: 'Giảm đến 50% tất cả sản phẩm',
    image: '/images/banner1.jpg',
    link: '/flash-sale',
    backgroundColor: '#ff6b35'
  },
  {
    id: '2',
    title: 'Tai nghe Gaming',
    subtitle: 'Bộ sưu tập gaming gear',
    image: '/images/banner2.jpg',
    link: '/tai-nghe-gaming',
    backgroundColor: '#4a90e2'
  },
  {
    id: '3',
    title: 'Loa JBL',
    subtitle: 'Âm thanh chất lượng cao',
    image: '/images/banner3.jpg',
    link: '/brand/jbl',
    backgroundColor: '#f39c12'
  },
  {
    id: '4',
    title: 'Freeship toàn quốc',
    subtitle: 'Đơn hàng từ 299k',
    image: '/images/banner4.jpg',
    link: '/promotion',
    backgroundColor: '#27ae60'
  },
  {
    id: '5',
    title: 'Âm thanh Hi-Fi',
    subtitle: 'Trải nghiệm âm thanh đỉnh cao',
    image: '/images/banner5.jpg',
    link: '/hi-fi',
    backgroundColor: '#9b59b6'
  },
  {
    id: '6',
    title: 'Phụ kiện âm thanh',
    subtitle: 'Hoàn thiện setup của bạn',
    image: '/images/banner6.jpg',
    link: '/phu-kien',
    backgroundColor: '#34495e'
  }
];