import React from 'react';
import type { Furniture } from './index';

// Component cho bàn
const Table3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  return (
    <group position={furniture.position} rotation={furniture.rotation} scale={furniture.scale}>
      {/* Mặt bàn */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.1, 0.8]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Chân bàn */}
      <mesh position={[-0.7, 0.2, -0.3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.7, 0.2, -0.3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[-0.7, 0.2, 0.3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.7, 0.2, 0.3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
};

// Component cho ghế
const Chair3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  return (
    <group position={furniture.position} rotation={furniture.rotation} scale={furniture.scale}>
      {/* Mặt ghế */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Lưng ghế */}
      <mesh position={[0, 0.6, -0.25]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Chân ghế */}
      <mesh position={[-0.25, 0.15, -0.25]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.25, 0.15, -0.25]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[-0.25, 0.15, 0.25]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.25, 0.15, 0.25]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
};

// Component cho kệ
const Shelf3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  return (
    <group position={furniture.position} rotation={furniture.rotation} scale={furniture.scale}>
      {/* Khung kệ */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1, 0.3]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Các ngăn kệ */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.75, 0.02, 0.25]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.75, 0.02, 0.25]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.75, 0.02, 0.25]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
};

// Component cho tủ
const Cabinet3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  return (
    <group position={furniture.position} rotation={furniture.rotation} scale={furniture.scale}>
      {/* Thân tủ */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.4]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Cửa tủ */}
      <mesh position={[-0.25, 0.6, 0.21]}>
        <boxGeometry args={[0.25, 1.1, 0.02]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.25, 0.6, 0.21]}>
        <boxGeometry args={[0.25, 1.1, 0.02]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Tay nắm cửa */}
      <mesh position={[-0.15, 0.6, 0.22]}>
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0.15, 0.6, 0.22]}>
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
};

// Component cho giường
const Bed3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  return (
    <group position={furniture.position} rotation={furniture.rotation} scale={furniture.scale}>
      {/* Khung giường */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 2.2]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Đầu giường */}
      <mesh position={[0, 0.4, -1]}>
        <boxGeometry args={[1.8, 0.8, 0.1]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Chân giường */}
      <mesh position={[-0.8, 0.05, -1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.8, 0.05, -1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[-0.8, 0.05, 1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.8, 0.05, 1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
};

// Component chính để render furniture
const Furniture3D: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  switch (furniture.type) {
    case 'table':
      return <Table3D furniture={furniture} />;
    case 'chair':
      return <Chair3D furniture={furniture} />;
    case 'shelf':
      return <Shelf3D furniture={furniture} />;
    case 'cabinet':
      return <Cabinet3D furniture={furniture} />;
    case 'bed':
      return <Bed3D furniture={furniture} />;
    default:
      return null;
  }
};

export default Furniture3D;
