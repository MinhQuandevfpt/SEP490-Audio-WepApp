// Static data for ProductList components
export const PRODUCT_CATEGORIES_DATA = [
  { id: 'loa', name: 'Loa', icon: '🔊', description: 'Loa Bluetooth, loa karaoke, loa hội trường' },
  { id: 'tai-nghe', name: 'Tai Nghe', icon: '🎧', description: 'Tai nghe Bluetooth, tai nghe gaming, tai nghe studio' },
  { id: 'micro', name: 'Micro', icon: '🎤', description: 'Micro không dây, micro cầm tay, micro thu âm' },
  { id: 'dac', name: 'DAC', icon: '🎵', description: 'Bộ chuyển đổi tín hiệu số sang analog' },
  { id: 'mixer', name: 'Mixer', icon: '🎛️', description: 'Bàn trộn âm thanh, mixer DJ, mixer studio' },
  { id: 'amp', name: 'Amp', icon: '⚡', description: 'Ampli công suất, ampli tích hợp, ampli tube' },
  { id: 'turntable', name: 'Turntable', icon: '💿', description: 'Đầu đĩa than, turntable DJ, turntable hifi' },
  { id: 'sound-card', name: 'Sound Card', icon: '🔌', description: 'Card âm thanh, audio interface, sound card gaming' },
  { id: 'dj-controller', name: 'DJ Controller', icon: '🎚️', description: 'Bàn điều khiển DJ, controller DJ, mixer DJ' },
  { id: 'combo', name: 'Combo', icon: '📦', description: 'Bộ combo âm thanh, combo karaoke, combo hội trường' },
] as const;

export const PRODUCT_BRANDS_DATA = [
  { id: 'sony', name: 'Sony', logo: 'https://example.com/logos/sony.png' },
  { id: 'jbl', name: 'JBL', logo: 'https://example.com/logos/jbl.png' },
  { id: 'bose', name: 'Bose', logo: 'https://example.com/logos/bose.png' },
  { id: 'sennheiser', name: 'Sennheiser', logo: 'https://example.com/logos/sennheiser.png' },
  { id: 'audio-technica', name: 'Audio-Technica', logo: 'https://example.com/logos/audio-technica.png' },
  { id: 'shure', name: 'Shure', logo: 'https://example.com/logos/shure.png' },
  { id: 'yamaha', name: 'Yamaha', logo: 'https://example.com/logos/yamaha.png' },
  { id: 'pioneer', name: 'Pioneer', logo: 'https://example.com/logos/pioneer.png' },
  { id: 'denon', name: 'Denon', logo: 'https://example.com/logos/denon.png' },
  { id: 'marantz', name: 'Marantz', logo: 'https://example.com/logos/marantz.png' },
] as const;

export const PRODUCT_STATUS_LABELS = {
  active: 'Đang bán',
  draft: 'Bản nháp',
  inactive: 'Tạm dừng',
  out_of_stock: 'Hết hàng',
  discontinued: 'Ngừng sản xuất',
  unlisted: 'Không hiển thị',
  suspended: 'Tạm khóa',
  suspended_debt: 'Tạm khóa do nợ',
  banned: 'Bị cấm',
} as const;

export const PRODUCT_CONDITION_LABELS = {
  'Mới 100%': 'Mới 100%',
  'Refurbished': 'Đã qua sử dụng',
  'Used': 'Đã sử dụng',
  'Damaged': 'Hư hỏng',
} as const;

export const PRICE_RANGES = [
  { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { label: '1 - 5 triệu', min: 1000000, max: 5000000 },
  { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { label: 'Trên 20 triệu', min: 20000000, max: undefined },
] as const;

export const RATING_OPTIONS = [
  { value: 5, label: '5 sao trở lên', icon: '★★★★★' },
  { value: 4, label: '4 sao trở lên', icon: '★★★★☆' },
  { value: 3, label: '3 sao trở lên', icon: '★★★☆☆' },
  { value: 2, label: '2 sao trở lên', icon: '★★☆☆☆' },
  { value: 1, label: '1 sao trở lên', icon: '★☆☆☆☆' },
] as const;
