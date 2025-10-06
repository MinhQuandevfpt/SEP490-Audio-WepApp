export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  link: string;
}

export const featuredBrands: Brand[] = [
  {
    id: 'sony',
    name: 'Sony',
    logo: 'https://bcec.vn/upload/image/logo-Bksound-new2025.webp',
    description: 'Thương hiệu âm thanh hàng đầu thế giới',
    link: '/brand/sony'
  },
  {
    id: 'jbl',
    name: 'JBL',
    logo: 'https://bcec.vn/upload/image/Logo-JBL-1561350348-789562197.webp',
    description: 'Loa bluetooth chất lượng cao',
    link: '/brand/jbl'
  },
  {
    id: 'bose',
    name: 'Bose',
    logo: 'https://bcec.vn/upload/image/Logo-Bose.webp',
    description: 'Công nghệ chống ồn tiên tiến',
    link: '/brand/bose'
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: 'https://bcec.vn/upload/image/Logo-Denon.webp',
    description: 'Ecosystem âm thanh hoàn hảo',
    link: '/brand/apple'
  },
  {
    id: 'sennheiser',
    name: 'Sennheiser',
    logo: 'https://bcec.vn/upload/image/Logo-Klipsch.webp',
    description: 'Tai nghe audiophile cao cấp',
    link: '/brand/sennheiser'
  },
  {
    id: 'marshall',
    name: 'Marshall',
    logo: 'https://bcec.vn/upload/image/Logo-AKG.webp',
    description: 'Phong cách âm thanh rock n roll',
    link: '/brand/marshall'
  },
  {
    id: 'shure',
    name: 'Shure',
    logo: 'https://bcec.vn/upload/image/WiiM.webp',
    description: 'Micro chuyên nghiệp cho studio',
    link: '/brand/shure'
  },
  {
    id: 'audio-technica',
    name: 'Audio-Technica',
    logo: 'https://bcec.vn/upload/image/Logo-Musician.webp',
    description: 'Thiết bị âm thanh chuyên nghiệp',
    link: '/brand/audio-technica'
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    logo: 'https://bcec.vn/upload/image/Logo-Yamaha.webp',
    description: 'Nhạc cụ và âm thanh chuyên nghiệp',
    link: '/brand/yamaha'
  },
  {
    id: 'samsung',
    name: 'Samsung',
    logo: 'https://bcec.vn/upload/image/Goldmund.webp',
    description: 'Soundbar và loa không dây hiện đại',
    link: '/brand/samsung'
  },
  {
    id: 'harman-kardon',
    name: 'Harman Kardon',
    logo: 'https://bcec.vn/upload/image/Logo-Maxell.webp',
    description: 'Thiết kế loa cao cấp sang trọng',
    link: '/brand/harman-kardon'
  },
  {
    id: 'steelseries',
    name: 'SteelSeries',
    logo: 'https://bcec.vn/upload/image/Logo-VOiD.webp',
    description: 'Tai nghe gaming chuyên nghiệp',
    link: '/brand/steelseries'
  }
];