import React, { useRef } from 'react';
import { Text, Box } from '@react-three/drei';
import { Mesh } from 'three';
import type { RoomColors } from './index';

interface Room3DProps {
  length: number;
  width: number;
  height: number;
  colors?: RoomColors;
}

const Room3D: React.FC<Room3DProps> = ({ length, width, height, colors }) => {
  const meshRef = useRef<Mesh>(null);

  // Default colors nếu không có colors được truyền vào
  const defaultColors: RoomColors = {
    floor: '#8B4513',
    ceiling: '#F5F5DC',
    leftWall: '#D2B48C',
    rightWall: '#D2B48C',
    backWall: '#D2B48C'
  };

  const roomColors = colors || defaultColors;

  // Tạo 5 mặt của căn phòng (bỏ mặt trước để quan sát)
  const roomGeometry = [
    // Sàn nhà
    { 
      position: [0, -height/2, 0], 
      rotation: [-Math.PI/2, 0, 0], 
      size: [length, width, 0.1],
      color: roomColors.floor,
      name: 'floor'
    },
    // Trần nhà
    { 
      position: [0, height/2, 0], 
      rotation: [Math.PI/2, 0, 0], 
      size: [length, width, 0.1],
      color: roomColors.ceiling,
      name: 'ceiling'
    },
    // Tường trái
    { 
      position: [-length/2, 0, 0], 
      rotation: [0, 0, 0], 
      size: [0.1, height, width],
      color: roomColors.leftWall,
      name: 'leftWall'
    },
    // Tường phải
    { 
      position: [length/2, 0, 0], 
      rotation: [0, 0, 0], 
      size: [0.1, height, width],
      color: roomColors.rightWall,
      name: 'rightWall'
    },
    // Tường sau
    { 
      position: [0, 0, -width/2], 
      rotation: [0, 0, 0], 
      size: [length, height, 0.1],
      color: roomColors.backWall,
      name: 'backWall'
    }
  ];

  return (
    <group ref={meshRef}>
      {roomGeometry.map((wall, index) => (
        <Box
          key={index}
          position={wall.position as [number, number, number]}
          rotation={wall.rotation as [number, number, number]}
          args={wall.size as [number, number, number]}
        >
          <meshStandardMaterial 
            color={wall.color} 
            transparent 
            opacity={0.9}
            roughness={0.3}
            metalness={0.1}
          />
        </Box>
      ))}
      
      {/* Thêm grid trên sàn để dễ quan sát */}
      <gridHelper args={[Math.max(length, width), 20, "#666666", "#333333"]} position={[0, -height/2 + 0.01, 0]} />
      
      {/* Thêm text hiển thị kích thước */}
      <Text
        position={[0, height/2 + 0.5, 0]}
        fontSize={0.5}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${length}m x ${width}m x ${height}m`}
      </Text>
    </group>
  );
};

export default Room3D;
