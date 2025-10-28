import React, { Suspense, useMemo } from 'react';
import { useFBX } from '@react-three/drei';
import type { Listener } from './index';

interface ListenerAvatar3DProps {
  listener: Listener;
}

// Lightweight human avatar using remote FBX (no .glb in repo)
const ListenerModel: React.FC<{ scale?: number }> = ({ scale = 0.01 }) => {
  const fbx = useFBX('https://threejs.org/examples/models/fbx/Samba%20Dancing.fbx');

  // Ensure the model casts/receives light properly
  useMemo(() => {
    fbx.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [fbx]);

  return <primitive object={fbx} scale={scale} />;
};

const ListenerAvatar3D: React.FC<ListenerAvatar3DProps> = ({ listener }) => {
  return (
    <group position={listener.position} rotation={listener.rotation}>
      <Suspense fallback={null}>
        <ListenerModel />
      </Suspense>
    </group>
  );
};

export default ListenerAvatar3D;


