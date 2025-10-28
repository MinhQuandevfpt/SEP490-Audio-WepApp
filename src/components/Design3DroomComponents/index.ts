// 3D Room Components
export { default as Room3D } from './Room3D';
export { default as Canvas3D } from './Canvas3D';
export { default as FurnitureCanvas3D } from './FurnitureCanvas3D';
export { default as Furniture3D } from './Furniture3D';

// Control Components
export { default as ControlsPanel } from './ControlsPanel';
export { default as ControlNavigation } from './ControlNavigation';
export { default as RoomDesignSection } from './RoomDesignSection';
export { default as FurnitureDesignSection } from './FurnitureDesignSection';
export { default as FurnitureControls } from './FurnitureControls';
export { default as FurnitureColorPicker } from './FurnitureColorPicker';
export { default as SpeakerDesignSection } from './SpeakerDesignSection';
export { default as ListenerDesignSection } from './ListenerDesignSection';
export { default as DimensionControls } from './DimensionControls';
export { default as RoomPresets } from './RoomPresets';
export { default as ColorPicker } from './ColorPicker';

// Info Components
export { default as RoomInfo } from './RoomInfo';
export { default as Instructions } from './Instructions';

// Layout Components
export { default as Header } from './Header';

// Types
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface RoomColors {
  floor: string;
  ceiling: string;
  leftWall: string;
  rightWall: string;
  backWall: string;
}

export interface RoomPreset {
  id: string;
  name: string;
  dimensions: Dimensions;
  colors: RoomColors;
  description: string;
}

// Room Presets
export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'living-room',
    name: 'Phòng khách',
    dimensions: { length: 4.8, width: 4.2, height: 3.0 },
    colors: {
      floor: '#8B4513',
      ceiling: '#F5F5DC',
      leftWall: '#D2B48C',
      rightWall: '#D2B48C',
      backWall: '#D2B48C'
    },
    description: 'Phòng khách tiêu chuẩn với diện tích ~20m²'
  },
  {
    id: 'bedroom',
    name: 'Phòng ngủ',
    dimensions: { length: 4.0, width: 3.5, height: 2.9 },
    colors: {
      floor: '#8B4513',
      ceiling: '#F5F5DC',
      leftWall: '#E6E6FA',
      rightWall: '#E6E6FA',
      backWall: '#E6E6FA'
    },
    description: 'Phòng ngủ tiêu chuẩn với diện tích ~14m²'
  },
  {
    id: 'kitchen',
    name: 'Phòng ăn / Bếp',
    dimensions: { length: 3.5, width: 3.0, height: 2.8 },
    colors: {
      floor: '#8B4513',
      ceiling: '#F5F5DC',
      leftWall: '#FFF8DC',
      rightWall: '#FFF8DC',
      backWall: '#FFF8DC'
    },
    description: 'Phòng ăn/bếp tiêu chuẩn với diện tích ~10.5m²'
  }
];

// Default colors
export const DEFAULT_COLORS: RoomColors = {
  floor: '#8B4513',
  ceiling: '#F5F5DC',
  leftWall: '#D2B48C',
  rightWall: '#D2B48C',
  backWall: '#D2B48C'
};

// Control Panel Types
export type ControlSection = 'room' | 'furniture' | 'speakers' | 'listeners';

export interface ControlSectionInfo {
  id: ControlSection;
  title: string;
  icon: string;
  description: string;
}

export const CONTROL_SECTIONS: ControlSectionInfo[] = [
  {
    id: 'room',
    title: 'Thiết kế phòng',
    icon: '🏠',
    description: 'Chọn loại phòng, kích thước và màu sắc'
  },
  {
    id: 'furniture',
    title: 'Thiết kế nội thất',
    icon: '🪑',
    description: 'Chọn và đặt nội thất trong phòng'
  },
  {
    id: 'speakers',
    title: 'Thiết kế loa',
    icon: '🔊',
    description: 'Chọn loa, vị trí và cài đặt âm thanh'
  },
  {
    id: 'listeners',
    title: 'Vị trí người nghe',
    icon: '👥',
    description: 'Thêm và di chuyển vị trí người nghe'
  }
];

// Furniture Types
export interface Furniture {
  id: string;
  name: string;
  type: 'table' | 'chair' | 'shelf' | 'cabinet' | 'bed';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}

// Speaker Types
export interface Speaker {
  id: string;
  name: string;
  type: 'floor_single' | 'floor_pair' | 'desk_single' | 'desk_pair' | 'wall_single' | 'wall_pair' | 'amplifier';
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  power: number;
  quality: 'basic' | 'premium' | 'professional';
  isPlaying: boolean;
}

// Listener Types
export interface Listener {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
}
