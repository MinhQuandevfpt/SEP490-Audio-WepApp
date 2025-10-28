import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Room3D from './Room3D';
import Furniture3D from './Furniture3D';
import type { Furniture, Dimensions, RoomColors } from './index';

interface FurnitureCanvas3DProps {
  furniture: Furniture[];
  dimensions: Dimensions;
  colors: RoomColors;
  onFurnitureUpdate?: (id: string, updates: Partial<Furniture>) => void;
}

const FurnitureCanvas3D: React.FC<FurnitureCanvas3DProps> = ({ 
  furniture, 
  dimensions, 
  colors
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

      {/* Furniture Info Overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Nội thất trong phòng</div>
          <div className="text-xs">
            {furniture.length} vật thể • Sử dụng chuột để xoay/zoom
          </div>
        </div>
      </div>
    </div>
  );
};

export default FurnitureCanvas3D;
