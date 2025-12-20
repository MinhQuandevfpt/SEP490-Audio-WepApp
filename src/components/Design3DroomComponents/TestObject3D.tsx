import React, { useMemo, useState } from 'react';
import { Text, useGLTF } from '@react-three/drei';

interface TestObject3DProps {
  position: [number, number, number];
  isSelected?: boolean;
  onSelect?: () => void;
}

const TestObject3D: React.FC<TestObject3DProps> = ({ position, isSelected = false, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Load GLB model from public/jbl.glb (served at /jbl.glb)
  const gltf = useGLTF('/jbl.glb');
  const clonedScene = useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <group position={position}>
      {/* Invisible bounding box for easier clicking */}
      <mesh
        position={[0, 0.25, 0]}
        visible={false}
        userData={{ isTestObject: true }}
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
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* GLB speaker/object */}
      <group
        userData={{ isTestObject: true }}
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
        <primitive object={clonedScene} scale={[0.2, 0.2, 0.2]} />
      </group>

      {/* Selection label */}
      {isSelected && (
        <Text
          position={[0, 0.5, 0]}
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
          position={[0, 0.5, 0]}
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

export default TestObject3D;

// Preload model for performance
useGLTF.preload('/jbl.glb');

