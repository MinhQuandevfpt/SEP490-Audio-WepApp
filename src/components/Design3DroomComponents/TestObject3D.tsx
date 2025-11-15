import React from 'react';
import { Box, Text } from '@react-three/drei';

interface TestObject3DProps {
  position: [number, number, number];
  color?: string;
}

const TestObject3D: React.FC<TestObject3DProps> = ({ position, color = '#FF6B6B' }) => {
  return (
    <group position={position}>
      {/* Main object - a box */}
      <Box args={[0.3, 0.3, 0.3]}>
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Box>
      
      {/* Wireframe outline for visibility */}
      <Box args={[0.3, 0.3, 0.3]}>
        <meshStandardMaterial 
          color={color}
          wireframe
          transparent
          opacity={0.3}
        />
      </Box>
      
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
      
      {/* Axis indicators */}
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.05, 0.02, 0.02]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.05, 0.02]} />
        <meshStandardMaterial color="#00FF00" />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="#0000FF" />
      </mesh>
    </group>
  );
};

export default TestObject3D;

