import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Room3D from './Room3D';
import Furniture3D from './Furniture3D';
import ListenerAvatar3D from './ListenerAvatar3D';
import Speaker3D from './Speaker3D';
import TestObject3D from './TestObject3D';
import type { Dimensions, RoomColors, Furniture, Listener, Speaker } from './index';

interface Canvas3DProps {
  dimensions: Dimensions;
  colors: RoomColors;
  furniture?: Furniture[];
  listeners?: Listener[];
  speakers?: Speaker[];
  testObjectPosition?: [number, number, number] | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ 
  dimensions, 
  colors, 
  furniture = [], 
  listeners = [], 
  speakers = [],
  testObjectPosition = null
}) => {
  return (
    <div className="flex-1 relative">
      <Canvas
        camera={{ 
          position: [8, 5, 8], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Room */}
        <Room3D 
          length={dimensions.length} 
          width={dimensions.width} 
          height={dimensions.height}
          colors={colors}
        />

        {/* Furniture */}
        {furniture.map((item) => (
          <Furniture3D key={item.id} furniture={item} />
        ))}

        {/* Listeners (Human avatars) */}
        {listeners.map((l) => (
          <ListenerAvatar3D key={l.id} listener={l} />
        ))}

        {/* Speakers */}
        {speakers.map((speaker) => (
          <Speaker3D key={speaker.id} speaker={speaker} />
        ))}

        {/* Test Object - Movable object */}
        {testObjectPosition && (
          <TestObject3D position={testObjectPosition} />
        )}

        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={50}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Phòng 3D</div>
          <div className="text-xs">
            {furniture.length} nội thất • {speakers.length} loa • Sử dụng chuột để xoay/zoom
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas3D;
