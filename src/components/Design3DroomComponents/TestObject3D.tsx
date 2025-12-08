import React, { useMemo } from 'react';
import { Text, useGLTF } from '@react-three/drei';

interface TestObject3DProps {
  position: [number, number, number];
}

const TestObject3D: React.FC<TestObject3DProps> = ({ position }) => {
  // Load GLB model from public/jbl.glb (served at /jbl.glb)
  const gltf = useGLTF('/jbl.glb');
  const clonedScene = useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  return (
    <group position={position}>
      {/* GLB speaker/object */}
      <primitive object={clonedScene} scale={[0.2, 0.2, 0.2]} />

      {/* Label */}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.1}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        Test Object
      </Text>
    </group>
  );
};

export default TestObject3D;

// Preload model for performance
useGLTF.preload('/jbl.glb');

