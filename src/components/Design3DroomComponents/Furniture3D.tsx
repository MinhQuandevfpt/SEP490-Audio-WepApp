import React, { useState } from 'react';
import { Ring, Text } from '@react-three/drei';
import type { Furniture } from './index';

interface Furniture3DWrapperProps {
  furniture: Furniture;
  isSelected?: boolean;
  onSelect?: () => void;
}

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
const Furniture3D: React.FC<Furniture3DWrapperProps> = ({ 
  furniture, 
  isSelected = false,
  onSelect 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  // Tính toán bounding box dựa trên type
  const getBoundingBox = () => {
    switch (furniture.type) {
      case 'table':
        return { size: [1.6, 0.5, 0.8], offset: [0, 0.4, 0] };
      case 'chair':
        return { size: [0.6, 0.7, 0.6], offset: [0, 0.4, 0] };
      case 'shelf':
        return { size: [0.8, 1.0, 0.3], offset: [0, 0.5, 0] };
      case 'cabinet':
        return { size: [0.6, 1.2, 0.4], offset: [0, 0.6, 0] };
      case 'bed':
        return { size: [1.8, 0.3, 2.2], offset: [0, 0.2, 0] };
      default:
        return { size: [1, 1, 1], offset: [0, 0.5, 0] };
    }
  };

  const boundingBox = getBoundingBox();
  const maxDimension = Math.max(...boundingBox.size);
  const ringRadius = maxDimension * 0.7;

  let furnitureComponent;
  switch (furniture.type) {
    case 'table':
      furnitureComponent = <Table3D furniture={furniture} />;
      break;
    case 'chair':
      furnitureComponent = <Chair3D furniture={furniture} />;
      break;
    case 'shelf':
      furnitureComponent = <Shelf3D furniture={furniture} />;
      break;
    case 'cabinet':
      furnitureComponent = <Cabinet3D furniture={furniture} />;
      break;
    case 'bed':
      furnitureComponent = <Bed3D furniture={furniture} />;
      break;
    default:
      return null;
  }

  return (
    <group>
      {/* Invisible bounding box for easier clicking */}
      <mesh
        position={boundingBox.offset as [number, number, number]}
        visible={false}
        userData={{ isFurniture: true, furnitureId: furniture.id }}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
        <boxGeometry args={boundingBox.size as [number, number, number]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Selection Ring - Hiển thị khi được select */}
      {isSelected && (
        <>
          {/* Outer glow ring */}
          <Ring
            args={[ringRadius, ringRadius + 0.2, 32]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[boundingBox.offset[0], 0.1, boundingBox.offset[2]]}
          >
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </Ring>
          {/* Inner selection ring */}
          <Ring
            args={[ringRadius - 0.2, ringRadius, 32]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[boundingBox.offset[0], 0.1, boundingBox.offset[2]]}
          >
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={1.2}
              transparent
              opacity={0.8}
            />
          </Ring>
        </>
      )}

      {/* Hover Ring - Hiển thị khi hover nhưng chưa select */}
      {!isSelected && isHovered && (
        <Ring
          args={[ringRadius - 0.1, ringRadius + 0.1, 32]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[boundingBox.offset[0], 0.1, boundingBox.offset[2]]}
        >
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={0.4}
            transparent
            opacity={0.4}
          />
        </Ring>
      )}

      {/* Furniture component */}
      <group
        userData={{ isFurniture: true, furnitureId: furniture.id }}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
        {furnitureComponent}
      </group>

      {/* Selection label */}
      {isSelected && (
        <Text
          position={[boundingBox.offset[0] as number, (boundingBox.size[1] as number) + 0.3, boundingBox.offset[2] as number]}
          fontSize={0.15}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          ✓ Đã chọn
        </Text>
      )}

      {/* Hover label */}
      {!isSelected && isHovered && (
        <Text
          position={[boundingBox.offset[0] as number, (boundingBox.size[1] as number) + 0.3, boundingBox.offset[2] as number]}
          fontSize={0.12}
          color="#ffff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Click để chọn
        </Text>
      )}
    </group>
  );
};

export default Furniture3D;
