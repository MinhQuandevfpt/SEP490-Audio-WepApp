// 3D Room Components
export { default as Room3D } from './Room3D';
export { default as Canvas3D } from './Canvas3D';
export { default as FurnitureCanvas3D } from './FurnitureCanvas3D';
export { default as Furniture3D } from './Furniture3D';
export { default as ListenerAvatar3D } from './ListenerAvatar3D';
export { default as Speaker3D } from './Speaker3D';

// Control Components
export { default as ControlsPanel } from './ControlsPanel';
export { default as ControlNavigation } from './ControlNavigation';
export { default as RoomDesignSection } from './RoomDesignSection';
export { default as FurnitureDesignSection } from './FurnitureDesignSection';
export { default as FurnitureControls } from './FurnitureControls';
export { default as FurnitureColorPicker } from './FurnitureColorPicker';
export { default as SpeakerDesignSection } from './SpeakerDesignSection';
export { default as ListenerDesignSection } from './ListenerDesignSection';
export { default as ListenerControls } from './ListenerControls';
export { default as DimensionControls } from './DimensionControls';
export { default as RoomPresets } from './RoomPresets';
export { default as ColorPicker } from './ColorPicker';

// Info Components
export { default as RoomInfo } from './RoomInfo';
export { default as Instructions } from './Instructions';

// Layout Components
export { default as Header } from './Header';

// Audio Components
export { default as AudioPlayer } from './AudioPlayer';

// Test Components
export { default as TestObject3D } from './TestObject3D';

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

// Custom Speaker Specifications
export interface CustomSpeakerSpecs {
  // Frequency Response (Hz)
  frequencyLow: number;      // 20-200 Hz (Bass range)
  frequencyHigh: number;     // 2000-50000 Hz (Treble range)
  
  // Power (Watts)
  power: number;             // 10-500W
  
  // Impedance (Ohms)
  impedance: number;          // 4, 6, 8, 16 ohms
  
  // Sensitivity (dB/W/m)
  sensitivity: number;        // 80-120 dB
  
  // EQ Adjustments (dB)
  bassBoost: number;          // -12 to +12 dB
  midBoost: number;           // -12 to +12 dB
  trebleBoost: number;       // -12 to +12 dB
  
  // Total Harmonic Distortion (%)
  thd: number;                // 0.1-5%
  
  // Crossover Frequency (Hz) - for multi-driver speakers
  crossoverFrequency?: number; // 200-5000 Hz
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
  customSpecs?: CustomSpeakerSpecs; // Custom specifications for audio processing
  // Audio properties for PositionalAudio
  volume?: number; // 0-1, default 1.0 (volume chuẩn)
  refDistance?: number; // Khoảng cách bắt đầu giảm âm (m), default 1.2 (khoảng cách nghe bình thường)
  maxDistance?: number; // Khoảng cách tối đa còn nghe (m), default 12
  rolloffFactor?: number; // Tốc độ suy giảm, default 1 (chuẩn)
  coneInnerAngle?: number; // Góc cone trong (degrees), default 60
  coneOuterAngle?: number; // Góc cone ngoài (degrees), default 120
  coneOuterGain?: number; // Gain ngoài cone (0-1), default 0.3
}

// Listener Types
export interface Listener {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
}
