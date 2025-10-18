import React, { useRef } from 'react';
import { Text, Box } from '@react-three/drei';
import { Mesh } from 'three';

interface Room3DProps {
  length: number;
  width: number;
  height: number;
}

const Room3D: React.FC<Room3DProps> = ({ length, width, height }) => {
  const meshRef = useRef<Mesh>(null);

  // Tạo 5 mặt của căn phòng (bỏ mặt trước để quan sát)
  const roomGeometry = [
    // Sàn nhà
    { position: [0, -height/2, 0], rotation: [-Math.PI/2, 0, 0], size: [length, width, 0.1] },
    // Trần nhà
    { position: [0, height/2, 0], rotation: [Math.PI/2, 0, 0], size: [length, width, 0.1] },
    // Tường trái
    { position: [-length/2, 0, 0], rotation: [0, 0, 0], size: [0.1, height, width] },
    // Tường phải
    { position: [length/2, 0, 0], rotation: [0, 0, 0], size: [0.1, height, width] },
    // Tường sau
    { position: [0, 0, -width/2], rotation: [0, 0, 0], size: [length, height, 0.1] }
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
            color={index === 0 ? "#8B4513" : index === 1 ? "#F5F5DC" : "#D2B48C"} 
            transparent 
            opacity={0.8}
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
