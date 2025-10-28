import React, { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Listener } from './index';

interface ListenerAvatar3DProps {
  listener: Listener;
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
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={scale} />;
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


