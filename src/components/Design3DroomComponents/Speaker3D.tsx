import React from 'react';
import { Box, Text } from '@react-three/drei';
import type { Speaker } from './index';

interface Speaker3DProps {
  speaker: Speaker;
}

const Speaker3D: React.FC<Speaker3DProps> = ({ speaker }) => {
  // Kích thước loa theo loại
  const getSpeakerDimensions = () => {
    switch (speaker.type) {
      case 'floor_single':
      case 'floor_pair':
        return { width: 0.3, height: 1.0, depth: 0.3 }; // Loa đứng
      case 'desk_single':
      case 'desk_pair':
        return { width: 0.2, height: 0.25, depth: 0.15 }; // Loa để bàn
      case 'wall_single':
      case 'wall_pair':
        return { width: 0.25, height: 0.4, depth: 0.15 }; // Loa treo tường
      case 'amplifier':
        return { width: 0.4, height: 0.15, depth: 0.3 }; // Amply
      default:
        return { width: 0.3, height: 0.5, depth: 0.3 };
    }
  };

  const getSpeakerPosition = () => {
    // Điều chỉnh vị trí Y theo loại loa
    const baseY = speaker.position[1];
    const dims = getSpeakerDimensions();
    
    if (speaker.type === 'floor_single' || speaker.type === 'floor_pair') {
      return [speaker.position[0], baseY + dims.height / 2, speaker.position[2]] as [number, number, number];
    }
    if (speaker.type === 'wall_single' || speaker.type === 'wall_pair') {
      return [speaker.position[0], baseY + dims.height / 2, speaker.position[2]] as [number, number, number];
    }
    return speaker.position;
  };

  const dims = getSpeakerDimensions();
  const pos = getSpeakerPosition();

  return (
    <group position={pos} rotation={speaker.rotation}>
      {/* Thân loa chính */}
      <Box args={[dims.width, dims.height, dims.depth]}>
        <meshStandardMaterial 
          color={speaker.color}
          metalness={0.3}
          roughness={0.4}
        />
      </Box>
      
      {/* Lưới loa (grill) */}
      <Box args={[dims.width * 0.95, dims.height * 0.8, dims.depth * 0.1]} position={[0, 0, dims.depth / 2 + 0.01]}>
        <meshStandardMaterial 
          color="#333333"
          metalness={0.5}
          roughness={0.7}
          transparent
          opacity={0.7}
        />
      </Box>

      {/* LED indicator khi đang phát */}
      {speaker.isPlaying && (
        <>
          <Box args={[0.02, 0.02, 0.02]} position={[dims.width / 2 - 0.05, dims.height / 2 - 0.05, dims.depth / 2 + 0.02]}>
            <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={1} />
          </Box>
          {/* Sound waves effect */}
          <Box args={[dims.width * 1.2, dims.height * 1.2, 0.01]} position={[0, 0, dims.depth / 2 + 0.05]}>
            <meshStandardMaterial 
              color="#00FF00"
              transparent
              opacity={0.3}
              emissive="#00FF00"
              emissiveIntensity={0.5}
            />
          </Box>
        </>
      )}

      {/* Label hiển thị tên loa */}
      <Text
        position={[0, dims.height / 2 + 0.1, 0]}
        fontSize={0.1}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {speaker.name}
      </Text>
    </group>
  );
};

export default Speaker3D;

