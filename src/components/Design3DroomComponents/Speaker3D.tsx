import React, { useEffect, useRef } from 'react';
import { Box, Text, PositionalAudio } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Speaker, Listener } from './index';
import type { PositionalAudio as ThreePositionalAudio } from 'three';

interface Speaker3DProps {
  speaker: Speaker;
  listeners?: Listener[]; // Danh sách listeners để tính toán vị trí người nghe
  selectedListenerId?: string | null; // ID của listener được chọn (ưu tiên)
  audioUrl?: string; // URL của file audio
}

// Encode default URL to tránh lỗi khi tên file có dấu cách
const DEFAULT_AUDIO_URL = '/Thịnh%20Vượng%20Việt%20Nam%20Sáng%20Ngời.mp3';

const Speaker3D: React.FC<Speaker3DProps> = ({ 
  speaker, 
  listeners = [],
  selectedListenerId = null,
  audioUrl = DEFAULT_AUDIO_URL 
}) => {
  const audioRef = useRef<ThreePositionalAudio | null>(null);
  const { camera } = useThree();

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

  // Tính toán listener position: ưu tiên listener avatar được chọn, nếu không có thì dùng camera
  const getListenerPosition = (): THREE.Vector3 => {
    // Nếu có listener avatar được chọn, dùng vị trí của nó
    if (selectedListenerId) {
      const selectedListener = listeners.find(l => l.id === selectedListenerId);
      if (selectedListener) {
        return new THREE.Vector3(...selectedListener.position);
      }
    }
    // Nếu không có listener avatar được chọn, dùng camera position
    return camera.position;
  };

  // Effect để cấu hình audio properties
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Base volume từ speaker.volume hoặc default 0.15 (15%)
    const baseVolume = speaker.volume ?? 0.15;

    // Tắt distance attenuation của PositionalAudio để tự tính volume
    // Set refDistance rất lớn để không bị giảm volume tự động
    audio.setRefDistance(1000.0);   // Rất lớn để không trigger distance attenuation
    audio.setMaxDistance(1000.0);   // Rất lớn để không bị mute
    audio.setRolloffFactor(0);      // Tắt rolloff
    audio.setDistanceModel('linear'); // Model suy giảm (nhưng không dùng vì refDistance lớn)
    audio.setLoop(true);

    // Set base volume ban đầu
    audio.setVolume(baseVolume);
    
    // Đảm bảo audio context không bị suspended
    if (audio.context.state === 'suspended') {
      audio.context.resume().catch(() => {});
    }

    // Chờ buffer load xong trước khi play
    const checkBufferAndPlay = async () => {
      // Đợi buffer load xong
      let retries = 0;
      while (!audio.buffer && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!audio.buffer) {
        // eslint-disable-next-line no-console
        console.warn(`Speaker ${speaker.name}: Audio buffer not loaded after waiting`);
        return;
      }

      // PositionalAudio từ @react-three/drei tự động lấy listener từ camera context
      // Listener được setup bởi ListenerSync component trong Canvas3D

    const resumeIfNeeded = async () => {
      if (audio.context.state === 'suspended') {
        await audio.context.resume().catch(() => {});
      }
    };

    const playSafe = async () => {
      await resumeIfNeeded();
      try {
        await audio.play();
          // eslint-disable-next-line no-console
          console.log(`Speaker ${speaker.name} started playing, baseVolume=${baseVolume}, position=[${pos.join(', ')}]`);
      } catch (err) {
        // eslint-disable-next-line no-console
          console.warn(`Speaker ${speaker.name} PositionalAudio play blocked:`, err);
      }
    };

    if (speaker.isPlaying) {
        await playSafe();
    } else {
      audio.stop?.();
    }
    };

    checkBufferAndPlay();

    return () => {
      if (audio) {
      audio.stop?.();
      }
    };
  }, [speaker.isPlaying, speaker.volume, pos, speaker.name, camera]);

  // Tính toán volume dựa trên distance: cứ cách 1m thì giảm 10% so với volume hiện tại
  // Logic: volume = baseVolume * (1 - distance * 0.1), nhưng không được < 0
  const lastDistanceRef = useRef<number | null>(null);
  const lastBaseVolumeRef = useRef<number | null>(null);
  
  useFrame(() => {
    const audio = audioRef.current;
    if (!audio || !speaker.isPlaying || !audio.buffer) return;

    // Lấy listener position
    const listenerPos = getListenerPosition();
    
    // Tính distance từ loa đến listener
    const speakerPos = new THREE.Vector3(...pos);
    const distance = speakerPos.distanceTo(listenerPos);

    // Base volume từ speaker.volume hoặc default 0.15 (15%)
    const baseVolume = speaker.volume ?? 0.15;

    // Tính volume: cứ cách 1m thì giảm 10% so với baseVolume
    // Ví dụ: baseVolume = 0.15 (15%)
    //   - Cách 0m: 0.15 * (1 - 0 * 0.1) = 0.15 (15%)
    //   - Cách 1m: 0.15 * (1 - 1 * 0.1) = 0.15 * 0.9 = 0.135 (13.5%)
    //   - Cách 2m: 0.15 * (1 - 2 * 0.1) = 0.15 * 0.8 = 0.12 (12%)
    //   - Cách 10m: 0.15 * (1 - 10 * 0.1) = 0.15 * 0 = 0 (0%)
    const volumeReduction = distance * 0.1; // 10% mỗi mét
    const calculatedVolume = baseVolume * Math.max(0, 1 - volumeReduction);
    
    // Update volume khi distance hoặc baseVolume thay đổi đáng kể
    const lastDistance = lastDistanceRef.current;
    const lastBaseVolume = lastBaseVolumeRef.current;
    const distanceChanged = lastDistance === null || Math.abs(distance - lastDistance) > 0.05;
    const baseVolumeChanged = lastBaseVolume === null || Math.abs(baseVolume - lastBaseVolume) > 0.01;
    
    if (distanceChanged || baseVolumeChanged) {
      audio.setVolume(calculatedVolume);
      lastDistanceRef.current = distance;
      lastBaseVolumeRef.current = baseVolume;
      
      // Debug log
      // eslint-disable-next-line no-console
      console.log(`Speaker ${speaker.name}: distance=${distance.toFixed(2)}m, baseVolume=${baseVolume.toFixed(3)}, calculatedVolume=${calculatedVolume.toFixed(3)}`);
    }
  });

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

      {/* Positional audio gắn vào loa, volume thay đổi theo khoảng cách đến listener */}
      {/* PositionalAudio tự động lấy listener từ camera context (được setup bởi ListenerSync) */}
      {/* Distance attenuation được tắt trong useEffect, volume được tính thủ công trong useFrame */}
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

      {/* LED indicator - chỉ hiển thị visual, không phát nhạc */}
      {speaker.isPlaying && (
        <>
          <Box args={[0.02, 0.02, 0.02]} position={[dims.width / 2 - 0.05, dims.height / 2 - 0.05, dims.depth / 2 + 0.02]}>
            <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={1} />
          </Box>
          {/* Visual effect - chỉ để hiển thị, không phát nhạc */}
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

