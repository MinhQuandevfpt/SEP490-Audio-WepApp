# Design3DroomComponents - Hệ Thống Thiết Kế Phòng 3D và Mô Phỏng Âm Thanh

## 📋 Tổng Quan

`Design3DroomComponents` là một hệ thống hoàn chỉnh cho phép người dùng thiết kế và mô phỏng không gian phòng 3D với khả năng:
- Thiết kế phòng 3D với kích thước và màu sắc tùy chỉnh
- Thêm và bố trí nội thất (bàn, ghế, kệ, tủ, giường)
- Đặt loa và cấu hình âm thanh với thông số kỹ thuật chi tiết
- Thêm vị trí người nghe (listener) để mô phỏng trải nghiệm nghe
- Phát âm thanh spatial audio (âm thanh không gian) với hiệu ứng 3D
- Test âm thanh với các thông số loa tùy chỉnh

## 🏗️ Kiến Trúc Component

### Cấu Trúc Thư Mục

```
Design3DroomComponents/
├── index.ts                    # Export tất cả components và types
├── Canvas3D.tsx               # Component chính render 3D scene
├── Room3D.tsx                 # Render phòng 3D (tường, sàn, trần)
├── Speaker3D.tsx              # Render loa với PositionalAudio
├── Furniture3D.tsx            # Render nội thất (bàn, ghế, kệ, tủ, giường)
├── ListenerAvatar3D.tsx       # Render avatar người nghe
├── ControlsPanel.tsx           # Panel điều khiển chính
├── RoomDesignSection.tsx      # Section thiết kế phòng
├── FurnitureDesignSection.tsx # Section thiết kế nội thất
├── SpeakerDesignSection.tsx   # Section thiết kế loa và âm thanh
├── ListenerDesignSection.tsx  # Section quản lý vị trí người nghe
├── AudioPlayer.tsx            # Player âm thanh với EQ và effects
├── SpeakerSpecsModal.tsx      # Modal cấu hình thông số loa
├── ExportSpecsModal.tsx       # Modal export thông số
└── ... (các component hỗ trợ khác)
```

## 🎯 Các Tính Năng Chính

### 1. Thiết Kế Phòng 3D

**Component:** `Room3D.tsx`, `RoomDesignSection.tsx`

**Tính năng:**
- Tùy chỉnh kích thước phòng (length, width, height) - từ 1m đến 20m
- Chọn màu sắc cho từng bề mặt:
  - Sàn nhà (floor)
  - Trần nhà (ceiling)
  - Tường trái (leftWall)
  - Tường phải (rightWall)
  - Tường sau (backWall)
- Chọn preset phòng có sẵn:
  - Phòng khách (4.8m x 4.2m x 3.0m)
  - Phòng ngủ (4.0m x 3.5m x 2.9m)
  - Phòng ăn/Bếp (3.5m x 3.0m x 2.8m)

**Data Structure:**
```typescript
interface Dimensions {
  length: number;  // Chiều dài (m)
  width: number;   // Chiều rộng (m)
  height: number;  // Chiều cao (m)
}

interface RoomColors {
  floor: string;
  ceiling: string;
  leftWall: string;
  rightWall: string;
  backWall: string;
}
```

### 2. Thiết Kế Nội Thất

**Component:** `Furniture3D.tsx`, `FurnitureDesignSection.tsx`

**Tính năng:**
- Thêm các loại nội thất:
  - Bàn (table)
  - Ghế (chair)
  - Kệ (shelf)
  - Tủ (cabinet)
  - Giường (bed)
- Di chuyển và xoay nội thất trong không gian 3D
- Tùy chỉnh màu sắc và kích thước
- Chọn và chỉnh sửa nội thất đã thêm

**Data Structure:**
```typescript
interface Furniture {
  id: string;
  name: string;
  type: 'table' | 'chair' | 'shelf' | 'cabinet' | 'bed';
  position: [number, number, number];  // [x, y, z] trong meters
  rotation: [number, number, number]; // [x, y, z] trong radians
  scale: [number, number, number];
  color: string;
}
```

### 3. Thiết Kế Loa và Âm Thanh

**Component:** `Speaker3D.tsx`, `SpeakerDesignSection.tsx`, `AudioPlayer.tsx`

**Tính năng:**
- Thêm các loại loa:
  - Loa đứng đơn/cặp (floor_single/floor_pair)
  - Loa để bàn đơn/cặp (desk_single/desk_pair)
  - Loa treo tường đơn/cặp (wall_single/wall_pair)
  - Amply (amplifier)
- Cấu hình thông số loa chi tiết:
  - Frequency Response (Hz): Low (20-200), High (2000-50000)
  - Power (Watts): 10-500W
  - Impedance (Ohms): 4, 6, 8, 16
  - Sensitivity (dB/W/m): 80-120 dB
  - EQ Adjustments: Bass, Mid, Treble boost (-12 to +12 dB)
  - THD (Total Harmonic Distortion): 0.1-5%
  - Crossover Frequency: 200-5000 Hz
- Phát âm thanh spatial audio với PositionalAudio (Three.js)
- Volume tự động điều chỉnh theo khoảng cách từ loa đến listener
- Test âm thanh với thông số tùy chỉnh

**Data Structure:**
```typescript
interface Speaker {
  id: string;
  name: string;
  type: 'floor_single' | 'floor_pair' | 'desk_single' | 'desk_pair' | 'wall_single' | 'wall_pair' | 'amplifier';
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  power: number;
  quality: 'basic' | 'premium' | 'professional';
  isPlaying: boolean;
  customSpecs?: CustomSpeakerSpecs;
  volume?: number;              // 0-1, default 1.0
  refDistance?: number;         // Khoảng cách bắt đầu giảm âm (m)
  maxDistance?: number;        // Khoảng cách tối đa còn nghe (m)
  rolloffFactor?: number;       // Tốc độ suy giảm
  coneInnerAngle?: number;      // Góc cone trong (degrees)
  coneOuterAngle?: number;      // Góc cone ngoài (degrees)
  coneOuterGain?: number;       // Gain ngoài cone (0-1)
}

interface CustomSpeakerSpecs {
  frequencyLow: number;         // 20-200 Hz
  frequencyHigh: number;        // 2000-50000 Hz
  power: number;                // 10-500W
  impedance: number;            // 4, 6, 8, 16 ohms
  sensitivity: number;           // 80-120 dB
  bassBoost: number;            // -12 to +12 dB
  midBoost: number;             // -12 to +12 dB
  trebleBoost: number;          // -12 to +12 dB
  thd: number;                  // 0.1-5%
  crossoverFrequency?: number;  // 200-5000 Hz
}
```

### 4. Vị Trí Người Nghe (Listener)

**Component:** `ListenerAvatar3D.tsx`, `ListenerDesignSection.tsx`

**Tính năng:**
- Thêm nhiều vị trí người nghe trong phòng
- Sử dụng avatar 3D (Ready Player Me GLB model)
- Chọn listener để làm điểm nghe chính
- Camera tự động sync với listener được chọn
- Tính toán khoảng cách từ loa đến listener để điều chỉnh volume

**Data Structure:**
```typescript
interface Listener {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
}
```

### 5. Audio Player với EQ và Effects

**Component:** `AudioPlayer.tsx`

**Tính năng:**
- Phát file audio (MP3) với EQ presets
- Upload file audio tùy chỉnh
- Hiển thị waveform real-time
- Điều khiển play/pause, seek, volume
- Áp dụng EQ presets dựa trên thông số loa:
  - Bass boost/cut
  - Mid boost/cut
  - Treble boost/cut
  - Sensitivity adjustment
- Panning (left/right) cho stereo effect
- Minimize/maximize player

**Audio Service Integration:**
- Sử dụng `AudioService` từ `services/audio/AudioService.ts`
- Xử lý Web Audio API cho EQ và effects
- Real-time audio processing

## 🔄 Data Flow và State Management

### State Hierarchy

```
3DRoom (Parent Component)
├── dimensions: Dimensions
├── colors: RoomColors
├── furniture: Furniture[]
├── listeners: Listener[]
├── speakers: Speaker[]
├── selectedFurnitureId: string | null
├── selectedListenerId: string | null
└── isTestObjectSelected: boolean
    │
    ├── ControlsPanel
    │   ├── RoomDesignSection → Update dimensions, colors
    │   ├── FurnitureDesignSection → CRUD furniture
    │   ├── SpeakerDesignSection → CRUD speakers, test audio
    │   └── ListenerDesignSection → CRUD listeners
    │
    └── Canvas3D
        ├── Room3D → Render phòng
        ├── Furniture3D[] → Render nội thất
        ├── Speaker3D[] → Render loa + PositionalAudio
        ├── ListenerAvatar3D[] → Render avatar người nghe
        └── TestObject3D → Render test object (nếu có)
```

### Event Flow

1. **User thay đổi thiết kế phòng:**
   ```
   RoomDesignSection → onDimensionChange/onColorChange 
   → 3DRoom state update 
   → Canvas3D re-render Room3D
   ```

2. **User thêm/sửa/xóa nội thất:**
   ```
   FurnitureDesignSection → onAddFurniture/onUpdateFurniture/onRemoveFurniture
   → 3DRoom state update
   → Canvas3D re-render Furniture3D[]
   ```

3. **User thêm/sửa loa:**
   ```
   SpeakerDesignSection → onAddSpeaker/onUpdateSpeaker
   → 3DRoom state update
   → Canvas3D re-render Speaker3D[]
   → Speaker3D initialize PositionalAudio
   ```

4. **User chọn listener:**
   ```
   ListenerDesignSection → onSelectListener
   → 3DRoom setSelectedListenerId
   → Canvas3D update camera position
   → Speaker3D[] recalculate distance và volume
   ```

5. **User test âm thanh:**
   ```
   SpeakerDesignSection → onTestSpeaker (với CustomSpeakerSpecs)
   → AudioPlayer mount với speakerModel
   → AudioService apply EQ presets
   → Play audio với effects
   ```

## 🎨 3D Rendering

### Technology Stack

- **React Three Fiber:** React renderer cho Three.js
- **Three.js:** 3D graphics library
- **@react-three/drei:** Helper components (OrbitControls, Grid, PositionalAudio, Text, etc.)

### Camera và Controls

- **OrbitControls:** Cho phép user xoay, zoom, pan camera
- **Camera position:** Sync với listener được chọn hoặc vị trí mặc định
- **Grid:** Hiển thị lưới để dễ định vị

### Lighting

- **AmbientLight:** Ánh sáng tổng thể (intensity: 0.6)
- **DirectionalLight:** Ánh sáng hướng (intensity: 1, có shadow)
- **PointLight:** Ánh sáng điểm (intensity: 0.5)

### Spatial Audio

**PositionalAudio (Three.js):**
- Mỗi loa có một `PositionalAudio` instance
- Audio được phát từ vị trí loa trong không gian 3D
- Volume tự động giảm theo khoảng cách đến listener
- Hỗ trợ cone angle (hướng phát âm)
- Listener được sync với camera position

**Distance Attenuation:**
- Volume = baseVolume * (1 - distance * attenuationFactor)
- Có thể tùy chỉnh `refDistance`, `maxDistance`, `rolloffFactor`

## 📡 API và Services

### AudioService

**File:** `services/audio/AudioService.ts`

**Chức năng:**
- Load và decode audio file
- Apply EQ presets (Bass, Mid, Treble)
- Panning (left/right)
- Volume control
- Real-time waveform analysis

**SpeakerModel:**
```typescript
interface SpeakerModel {
  id: string;
  name: string;
  brand: string;
  type: string;
  description: string;
  eqPreset: EQPreset;
  specs: {
    frequencyResponse: string;
    power: string;
    impedance: string;
    sensitivity: string;
  };
}
```

### NotificationService (không liên quan)

Lưu ý: `NotificationService` trong folder này không liên quan đến tính năng 3D room.

## 🎮 User Interactions

### Mouse/Touch Controls

1. **Camera Control:**
   - Click + Drag: Xoay camera
   - Scroll/Wheel: Zoom in/out
   - Right-click + Drag: Pan camera

2. **Object Selection:**
   - Click vào furniture/listener/speaker: Chọn object
   - Click vào empty space: Bỏ chọn

3. **Object Manipulation:**
   - Drag trong control panel: Thay đổi position/rotation
   - Color picker: Thay đổi màu sắc

### Keyboard Shortcuts

- Không có keyboard shortcuts hiện tại (có thể thêm trong tương lai)

## 🔧 Technical Details

### Performance Optimization

1. **Memoization:**
   - `useMemo` cho sorted data
   - `useCallback` cho event handlers
   - `React.memo` cho components (nếu cần)

2. **Lazy Loading:**
   - GLB models được load với `Suspense`
   - Audio buffers được load async

3. **Frame Rate:**
   - `useFrame` hook cho animations
   - Optimize re-renders

### Audio Context Management

- Mỗi `PositionalAudio` sử dụng shared `AudioContext`
- Context được resume khi user tương tác (browser policy)
- Cleanup khi component unmount

### Coordinate System

- **Origin (0,0,0):** Trung tâm phòng
- **X-axis:** Chiều dài (length), trái (-) → phải (+)
- **Y-axis:** Chiều cao (height), dưới (0) → trên (+)
- **Z-axis:** Chiều rộng (width), sau (-) → trước (+)
- **Units:** Meters (m)

## 📝 Usage Example

```typescript
import { 
  Header, 
  ControlsPanel, 
  Canvas3D 
} from '../../../components/Design3DroomComponents';

const ThreeDRoom: React.FC = () => {
  const [dimensions, setDimensions] = useState({ length: 5, width: 4, height: 3 });
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  return (
    <div className="flex h-screen">
      <ControlsPanel
        dimensions={dimensions}
        colors={colors}
        furniture={furniture}
        listeners={listeners}
        speakers={speakers}
        onDimensionChange={...}
        onColorChange={...}
        onAddFurniture={...}
        onAddListener={...}
        onAddSpeaker={...}
        // ... other handlers
      />
      <Canvas3D
        dimensions={dimensions}
        colors={colors}
        furniture={furniture}
        listeners={listeners}
        speakers={speakers}
        // ... other props
      />
    </div>
  );
};
```

## 🚀 Future Enhancements

1. **Room Acoustics Simulation:**
   - Reverb effects dựa trên kích thước phòng
   - Sound reflection từ tường
   - Absorption coefficients cho vật liệu

2. **Advanced Audio Features:**
   - Multi-channel audio (5.1, 7.1)
   - Subwoofer support
   - Room correction EQ

3. **Export/Import:**
   - Export thiết kế phòng thành JSON
   - Import thiết kế từ file
   - Share thiết kế với người khác

4. **VR Support:**
   - WebXR integration
   - VR headset support
   - Immersive audio experience

5. **Real-time Collaboration:**
   - Multiple users cùng thiết kế
   - Real-time sync
   - Voice chat integration

## 📚 Dependencies

- `react`: React framework
- `@react-three/fiber`: React renderer cho Three.js
- `@react-three/drei`: Helper components
- `three`: 3D graphics library
- `lucide-react`: Icons

## 🐛 Known Issues

1. **Audio Context Suspension:**
   - Browser yêu cầu user interaction trước khi phát audio
   - Cần click vào page trước khi audio có thể play

2. **Performance với nhiều loa:**
   - Nhiều PositionalAudio instances có thể ảnh hưởng performance
   - Cần optimize khi có > 10 loa

3. **GLB Model Loading:**
   - Listener avatar sử dụng external GLB model
   - Cần internet connection để load model

## 📖 References

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [PositionalAudio API](https://threejs.org/docs/#api/en/audio/PositionalAudio)

