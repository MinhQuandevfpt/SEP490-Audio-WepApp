// 3D Room Components
export { default as Room3D } from './Room3D';
export { default as Canvas3D } from './Canvas3D';

// Control Components
export { default as ControlsPanel } from './ControlsPanel';
export { default as DimensionControls } from './DimensionControls';

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
