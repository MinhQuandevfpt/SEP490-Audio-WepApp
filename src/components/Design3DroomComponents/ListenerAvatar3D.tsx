import React, { Suspense, useMemo, useState } from 'react';
import { useGLTF, Text } from '@react-three/drei';
import type { Listener } from './index';

interface ListenerAvatar3DProps {
  listener: Listener;
  isSelected?: boolean;
  onSelect?: () => void;
}

// High-quality human avatar using Ready Player Me GLB (no .glb in repo)
const ListenerModel: React.FC<{ scale?: number }> = ({ scale = 0.8 }) => {
  const { scene } = useGLTF('https://models.readyplayer.me/6900fa40d225dc31b3cb7fac.glb');

  // Ensure the model casts/receives light properly
  useMemo(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData = { ...child.userData, isListener: true };
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={scale} />;
};

const ListenerAvatar3D: React.FC<ListenerAvatar3DProps> = ({ 
  listener, 
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

  return (
    <group position={listener.position} rotation={listener.rotation}>
      {/* Invisible bounding box for easier clicking */}
      <mesh
        position={[0, 1, 0]}
        visible={false}
        userData={{ isListener: true, listenerId: listener.id }}
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
        <boxGeometry args={[1.5, 2.5, 1.5]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Selection indicator - chỉ hiển thị text, không có ring */}

      <Suspense fallback={null}>
        <group 
          userData={{ isListener: true, listenerId: listener.id }}
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
          <ListenerModel />
        </group>
      </Suspense>

      {/* Selection label */}
      {isSelected && (
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.2}
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
          position={[0, 2.2, 0]}
          fontSize={0.15}
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

export default ListenerAvatar3D;


