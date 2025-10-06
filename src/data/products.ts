export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  soldCount: number;
  isFlashSale?: boolean;
  isTopDeal?: boolean;
  category: string;
}

export const products: Product[] = [
  // Flash Sale Products (20 items)
  {
    id: 'fs1',
    name: 'Tai nghe Sony WH-1000XM4',
    brand: 'Sony',
    price: 6990000,
    originalPrice: 8990000,
    discount: 22,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/9c/2f/ef/88805db9501847d800ef69758e8e28c7.png.webp',
    rating: 4.8,
    soldCount: 1200,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs2',
    name: 'Loa JBL Charge 5',
    brand: 'JBL',
    price: 3490000,
    originalPrice: 4590000,
    discount: 24,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/1a/6f/30/af715d16aa6a475f2640a8b2f2600d18.jpg.webp',
    rating: 4.7,
    soldCount: 890,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs3',
    name: 'Tai nghe Apple AirPods Pro',
    brand: 'Apple',
    price: 5990000,
    originalPrice: 6990000,
    discount: 14,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/2c/ca/bd/6dde64710849edee3b72b15e67acbe86.jpg.webp',
    rating: 4.9,
    soldCount: 2100,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs4',
    name: 'Micro Shure SM58',
    brand: 'Shure',
    price: 2890000,
    originalPrice: 3490000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/65/ff/0e/4faeb0386cb37e22ba82ea5b7e729c8b.jpg.webp',
    rating: 4.6,
    soldCount: 450,
    isFlashSale: true,
    category: 'micro'
  },
  {
    id: 'fs5',
    name: 'Loa Marshall Kilburn II',
    brand: 'Marshall',
    price: 5990000,
    originalPrice: 6990000,
    discount: 14,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/fb/b5/4c/c605822e05a6ff62ce23b32dc48720e6.png.webp',
    rating: 4.7,
    soldCount: 620,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs6',
    name: 'Tai nghe Bose QuietComfort 35',
    brand: 'Bose',
    price: 7490000,
    originalPrice: 8990000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/a4/4a/63/000805ac49c17123d694f12be1126fb4.png.webp',
    rating: 4.8,
    soldCount: 850,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs7',
    name: 'Soundbar Samsung HW-Q60T',
    brand: 'Samsung',
    price: 8990000,
    originalPrice: 10990000,
    discount: 18,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/9b/18/89/dd4363e39b17f27c2b361c7c64345e57.jpg.webp',
    rating: 4.5,
    soldCount: 340,
    isFlashSale: true,
    category: 'soundbar'
  },
  {
    id: 'fs8',
    name: 'Tai nghe Gaming SteelSeries',
    brand: 'SteelSeries',
    price: 4490000,
    originalPrice: 5490000,
    discount: 18,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/91/2d/12/b9312fb501fb813928a4ce066cd33bc6.jpg.webp',
    rating: 4.6,
    soldCount: 780,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs9',
    name: 'Loa Edifier R1280T',
    brand: 'Edifier',
    price: 1990000,
    originalPrice: 2490000,
    discount: 20,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/01/4e/f0/fefdabac6c264b6daa066f1e5e1a3928.jpg.webp',
    rating: 4.4,
    soldCount: 1500,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs10',
    name: 'Micro Audio-Technica AT2020',
    brand: 'Audio-Technica',
    price: 3490000,
    originalPrice: 4190000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/fa/41/32/83ec267cbecfff49a0b42f13558594b7.jpg.webp',
    rating: 4.8,
    soldCount: 280,
    isFlashSale: true,
    category: 'micro'
  },
  {
    id: 'fs11',
    name: 'Tai nghe Sennheiser HD 560S',
    brand: 'Sennheiser',
    price: 4990000,
    originalPrice: 5990000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/23/07/8a/7e7e1215837611e673c81afd4d15d165.jpg.webp',
    rating: 4.7,
    soldCount: 320,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs12',
    name: 'Loa Bluetooth Anker',
    brand: 'Anker',
    price: 1490000,
    originalPrice: 1890000,
    discount: 21,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/b6/5a/11/9ca25d5174c8dfccde94858fb1014eaa.jpg.webp',
    rating: 4.5,
    soldCount: 950,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs13',
    name: 'Tai nghe Jabra Elite 85h',
    brand: 'Jabra',
    price: 6490000,
    originalPrice: 7990000,
    discount: 19,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/72/5c/b0/4f313086171a6b712fa025758b19b358.png.webp',
    rating: 4.6,
    soldCount: 420,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs14',
    name: 'Micro Blue Yeti',
    brand: 'Blue',
    price: 4490000,
    originalPrice: 5490000,
    discount: 18,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/05/58/26/5e0281e8deb13d3398fc854079aacee5.jpg.webp',
    rating: 4.7,
    soldCount: 380,
    isFlashSale: true,
    category: 'micro'
  },
  {
    id: 'fs15',
    name: 'Loa JBL Flip 5',
    brand: 'JBL',
    price: 2490000,
    originalPrice: 2990000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/94/04/63/ef7c48844bdcdc7763a324a751707f36.jpg.webp',
    rating: 4.6,
    soldCount: 720,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs16',
    name: 'Tai nghe Plantronics Voyager',
    brand: 'Plantronics',
    price: 3990000,
    originalPrice: 4790000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/e7/68/bf/3ece0c0847f61dbf4f8592af1b21b063.jpg.webp',
    rating: 4.5,
    soldCount: 560,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs17',
    name: 'Soundbar LG SN4',
    brand: 'LG',
    price: 3490000,
    originalPrice: 4290000,
    discount: 19,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/47/a1/6c/04e68b49df456b5381c0ef251d343f4a.jpg.webp',
    rating: 4.4,
    soldCount: 290,
    isFlashSale: true,
    category: 'soundbar'
  },
  {
    id: 'fs18',
    name: 'Tai nghe Audio-Technica M50x',
    brand: 'Audio-Technica',
    price: 3990000,
    originalPrice: 4890000,
    discount: 18,
    image: 'https://salt.tikicdn.com/cache/750x750/media/catalog/product/a/t/ath-m30x.jpg.webp',
    rating: 4.8,
    soldCount: 640,
    isFlashSale: true,
    category: 'tai-nghe'
  },
  {
    id: 'fs19',
    name: 'Loa Harman Kardon Onyx',
    brand: 'Harman Kardon',
    price: 4990000,
    originalPrice: 5990000,
    discount: 17,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/18/b5/36/7093a0746af69c2fb3cac03b5373093c.png.webp',
    rating: 4.7,
    soldCount: 380,
    isFlashSale: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'fs20',
    name: 'Micro Rode PodMic',
    brand: 'Rode',
    price: 6490000,
    originalPrice: 7890000,
    discount: 18,
    image: 'https://salt.tikicdn.com/cache/750x750/ts/product/26/80/01/b0d6eeea0ccb8b74c5249667e7282815.jpg.webp',
    rating: 4.9,
    soldCount: 220,
    isFlashSale: true,
    category: 'micro'
  },

  // Top Deal Products
  {
    id: 'td1',
    name: 'Tai nghe Bose QuietComfort 35 II',
    brand: 'Bose',
    price: 7490000,
    originalPrice: 8990000,
    discount: 17,
    image: '/images/bose-qc35.jpg',
    rating: 4.8,
    soldCount: 850,
    isTopDeal: true,
    category: 'tai-nghe'
  },
  {
    id: 'td2',
    name: 'Loa Marshall Kilburn II',
    brand: 'Marshall',
    price: 5990000,
    originalPrice: 6990000,
    discount: 14,
    image: '/images/marshall-kilburn.jpg',
    rating: 4.7,
    soldCount: 620,
    isTopDeal: true,
    category: 'loa-bluetooth'
  },
  {
    id: 'td3',
    name: 'Soundbar Samsung HW-Q60T',
    brand: 'Samsung',
    price: 8990000,
    originalPrice: 10990000,
    discount: 18,
    image: '/images/samsung-soundbar.jpg',
    rating: 4.5,
    soldCount: 340,
    isTopDeal: true,
    category: 'soundbar'
  },
  {
    id: 'td4',
    name: 'Tai nghe gaming SteelSeries Arctis 7',
    brand: 'SteelSeries',
    price: 4490000,
    originalPrice: 5490000,
    discount: 18,
    image: '/images/steelseries-arctis7.jpg',
    rating: 4.6,
    soldCount: 780,
    isTopDeal: true,
    category: 'tai-nghe'
  },

  // Regular Products
  {
    id: 'p1',
    name: 'Tai nghe Sennheiser HD 560S',
    brand: 'Sennheiser',
    price: 4990000,
    image: '/images/sennheiser-hd560s.jpg',
    rating: 4.7,
    soldCount: 320,
    category: 'tai-nghe'
  },
  {
    id: 'p2',
    name: 'Loa Edifier R1280T',
    brand: 'Edifier',
    price: 1990000,
    image: '/images/edifier-r1280t.jpg',
    rating: 4.4,
    soldCount: 1500,
    category: 'loa-bluetooth'
  },
  {
    id: 'p3',
    name: 'Micro Audio-Technica AT2020',
    brand: 'Audio-Technica',
    price: 3490000,
    image: '/images/at2020.jpg',
    rating: 4.8,
    soldCount: 280,
    category: 'micro'
  },
  {
    id: 'p4',
    name: 'DAC FiiO E10K',
    brand: 'FiiO',
    price: 1890000,
    image: '/images/fiio-e10k.jpg',
    rating: 4.5,
    soldCount: 450,
    category: 'amp-dac'
  }
];

export const flashSaleProducts = products.filter(p => p.isFlashSale);
export const topDealProducts = products.filter(p => p.isTopDeal);
export const regularProducts = products.filter(p => !p.isFlashSale && !p.isTopDeal);