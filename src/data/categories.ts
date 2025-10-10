export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}

export const categories: Category[] = [
  {
    id: 'tai-nghe',
    name: 'Tai Nghe',
    icon: '🎧',
    subcategories: ['Tai nghe có dây', 'Tai nghe không dây', 'Tai nghe gaming', 'Tai nghe thể thao']
  },
  {
    id: 'loa-bluetooth',
    name: 'Loa Bluetooth',
    icon: '🔊',
    subcategories: ['Loa mini', 'Loa di động', 'Loa karaoke', 'Loa gia đình']
  },
  {
    id: 'micro',
    name: 'Micro',
    icon: '🎤',
    subcategories: ['Micro karaoke', 'Micro thu âm', 'Micro gaming', 'Micro wireless']
  },
  {
    id: 'soundbar',
    name: 'Soundbar',
    icon: '📻',
    subcategories: ['Soundbar 2.1', 'Soundbar 5.1', 'Soundbar không dây', 'Soundbar TV']
  },
  {
    id: 'phu-kien',
    name: 'Phụ Kiện',
    icon: '🔌',
    subcategories: ['Cáp âm thanh', 'Adapter', 'Đế đỡ', 'Case bảo vệ']
  },
  {
    id: 'amp-dac',
    name: 'Ampli & DAC',
    icon: '⚡',
    subcategories: ['Ampli tai nghe', 'DAC', 'Combo Amp/DAC', 'Ampli loa']
  },
  {
    id: 'vinyl',
    name: 'Đầu đĩa than',
    icon: '💿',
    subcategories: ['Turntable', 'Cartridge', 'Phụ kiện vinyl']
  }
];