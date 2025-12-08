import React, { useEffect, useRef } from 'react';
import { Box, Text, PositionalAudio } from '@react-three/drei';
import type { Speaker } from './index';
import type { PositionalAudio as ThreePositionalAudio } from 'three';

interface Speaker3DProps {
  speaker: Speaker;
  audioUrl?: string;
}

// Encode default URL to tránh lỗi khi tên file có dấu cách
const DEFAULT_AUDIO_URL = '/See%20You%20Again%20Remix.mp3';

const Speaker3D: React.FC<Speaker3DProps> = ({ speaker, audioUrl = DEFAULT_AUDIO_URL }) => {
  const audioRef = useRef<ThreePositionalAudio | null>(null);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Tham số suy giảm âm theo khoảng cách (tương tác gần-xa)
    audio.setRefDistance(1);      // khoảng cách bắt đầu giảm âm (m)
    audio.setMaxDistance(15);     // khoảng cách tối đa còn nghe
    audio.setRolloffFactor(1.6);  // tốc độ suy giảm
    audio.setDistanceModel('inverse');
    audio.setLoop(true);

    if (!audio.buffer) return; // chờ buffer load xong

    const resumeIfNeeded = async () => {
      if (audio.context.state === 'suspended') {
        await audio.context.resume().catch(() => {});
      }
    };

    const playSafe = async () => {
      await resumeIfNeeded();
      try {
        await audio.play();
      } catch (err) {
        // Tránh crash do policy autoplay
        // eslint-disable-next-line no-console
        console.warn('PositionalAudio play blocked by browser:', err);
      }
    };

    if (speaker.isPlaying) {
      playSafe();
    } else {
      audio.stop?.();
    }

    return () => {
      audio.stop?.();
    };
  }, [speaker.isPlaying]);

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

      {/* Positional audio gắn vào loa, giảm âm theo khoảng cách tới listener (camera) */}
      <PositionalAudio
        ref={audioRef}
        url={audioUrl}
        autoplay={false}
        loop
      />
      
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

