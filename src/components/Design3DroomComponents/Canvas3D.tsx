import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Room3D from './Room3D';
import Furniture3D from './Furniture3D';
import ListenerAvatar3D from './ListenerAvatar3D';
import Speaker3D from './Speaker3D';
import TestObject3D from './TestObject3D';
import type { Dimensions, RoomColors, Furniture, Listener, Speaker } from './index';

interface Canvas3DProps {
  dimensions: Dimensions;
  colors: RoomColors;
  furniture?: Furniture[];
  listeners?: Listener[];
  speakers?: Speaker[];
  testObjectPosition?: [number, number, number] | null;
  onUpdateListener?: (id: string, updates: Partial<Listener>) => void;
  onUpdateFurniture?: (id: string, updates: Partial<Furniture>) => void;
  onUpdateTestObjectPosition?: (position: [number, number, number]) => void;
  selectedFurnitureId?: string | null;
  onSelectFurniture?: (id: string | null) => void;
  selectedListenerId?: string | null;
  onSelectListener?: (id: string | null) => void;
  isTestObjectSelected?: boolean;
  onSelectTestObject?: () => void;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ 
  dimensions, 
  colors, 
  furniture = [], 
  listeners = [], 
  speakers = [],
  testObjectPosition = null,
  onUpdateListener,
  onUpdateFurniture,
  onUpdateTestObjectPosition,
  selectedFurnitureId: propSelectedFurnitureId,
  onSelectFurniture,
  selectedListenerId: propSelectedListenerId,
  onSelectListener,
  isTestObjectSelected = false,
  onSelectTestObject
}) => {
  // Use props if provided, otherwise use internal state (backward compatibility)
  const [internalSelectedListenerId, setInternalSelectedListenerId] = useState<string | null>(null);
  const [internalSelectedFurnitureId, setInternalSelectedFurnitureId] = useState<string | null>(null);
  
  const selectedListenerId = propSelectedListenerId !== undefined ? propSelectedListenerId : internalSelectedListenerId;
  const selectedFurnitureId = propSelectedFurnitureId !== undefined ? propSelectedFurnitureId : internalSelectedFurnitureId;
  
  const setSelectedListenerId = (id: string | null) => {
    if (onSelectListener) {
      onSelectListener(id);
    } else {
      setInternalSelectedListenerId(id);
    }
  };
  
  const setSelectedFurnitureId = (id: string | null) => {
    if (onSelectFurniture) {
      onSelectFurniture(id);
    } else {
      setInternalSelectedFurnitureId(id);
    }
  };
  
  const moveStep = 0.5; // Bước di chuyển 0.5m

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ngăn chặn default behavior nếu đang nhập text hoặc trong input/textarea
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement || 
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA'
    ) {
      return;
    }

    const isAltPressed = e.altKey;
    const key = e.key.toLowerCase();
    let shouldUpdate = false;

    // Xử lý Listener
    if (selectedListenerId && onUpdateListener) {
      const selectedListener = listeners.find(l => l.id === selectedListenerId);
      if (selectedListener) {
        const newPosition = [...selectedListener.position] as [number, number, number];

        // W/S: Di chuyển lên/xuống (Y axis)
        if (key === 'w' && !isAltPressed) {
          e.preventDefault();
          newPosition[1] += moveStep;
          shouldUpdate = true;
        } else if (key === 's' && !isAltPressed) {
          e.preventDefault();
          newPosition[1] -= moveStep;
          shouldUpdate = true;
        }
        // A/D: Di chuyển trái/phải (X axis)
        else if (key === 'a' && !isAltPressed) {
          e.preventDefault();
          newPosition[0] -= moveStep;
          shouldUpdate = true;
        } else if (key === 'd' && !isAltPressed) {
          e.preventDefault();
          newPosition[0] += moveStep;
          shouldUpdate = true;
        }
        // Alt + W: Di chuyển vào trong (Z axis - backward, giảm Z)
        else if (key === 'w' && isAltPressed) {
          e.preventDefault();
          newPosition[2] -= moveStep;
          shouldUpdate = true;
        }
        // Alt + S: Di chuyển ra phía trước (Z axis - forward, tăng Z)
        else if (key === 's' && isAltPressed) {
          e.preventDefault();
          newPosition[2] += moveStep;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          onUpdateListener(selectedListenerId, { position: newPosition });
          return;
        }
      }
    }

    // Xử lý Furniture
    if (selectedFurnitureId && onUpdateFurniture) {
      const selectedFurniture = furniture.find(f => f.id === selectedFurnitureId);
      if (selectedFurniture) {
        const newPosition = [...selectedFurniture.position] as [number, number, number];
        shouldUpdate = false;

        // W/S: Di chuyển lên/xuống (Y axis)
        if (key === 'w' && !isAltPressed) {
          e.preventDefault();
          newPosition[1] += moveStep;
          shouldUpdate = true;
        } else if (key === 's' && !isAltPressed) {
          e.preventDefault();
          newPosition[1] -= moveStep;
          shouldUpdate = true;
        }
        // A/D: Di chuyển trái/phải (X axis)
        else if (key === 'a' && !isAltPressed) {
          e.preventDefault();
          newPosition[0] -= moveStep;
          shouldUpdate = true;
        } else if (key === 'd' && !isAltPressed) {
          e.preventDefault();
          newPosition[0] += moveStep;
          shouldUpdate = true;
        }
        // Alt + W: Di chuyển vào trong (Z axis - backward, giảm Z)
        else if (key === 'w' && isAltPressed) {
          e.preventDefault();
          newPosition[2] -= moveStep;
          shouldUpdate = true;
        }
        // Alt + S: Di chuyển ra phía trước (Z axis - forward, tăng Z)
        else if (key === 's' && isAltPressed) {
          e.preventDefault();
          newPosition[2] += moveStep;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          onUpdateFurniture(selectedFurnitureId, { position: newPosition });
        }
      }
    }

    // Xử lý Test Object
    if (isTestObjectSelected && testObjectPosition && onUpdateTestObjectPosition) {
      const newPosition = [...testObjectPosition] as [number, number, number];
      shouldUpdate = false;

      // W/S: Di chuyển lên/xuống (Y axis)
      if (key === 'w' && !isAltPressed) {
        e.preventDefault();
        newPosition[1] += moveStep;
        shouldUpdate = true;
      } else if (key === 's' && !isAltPressed) {
        e.preventDefault();
        newPosition[1] -= moveStep;
        shouldUpdate = true;
      }
      // A/D: Di chuyển trái/phải (X axis)
      else if (key === 'a' && !isAltPressed) {
        e.preventDefault();
        newPosition[0] -= moveStep;
        shouldUpdate = true;
      } else if (key === 'd' && !isAltPressed) {
        e.preventDefault();
        newPosition[0] += moveStep;
        shouldUpdate = true;
      }
      // Alt + W: Di chuyển vào trong (Z axis - backward, giảm Z)
      else if (key === 'w' && isAltPressed) {
        e.preventDefault();
        newPosition[2] -= moveStep;
        shouldUpdate = true;
      }
      // Alt + S: Di chuyển ra phía trước (Z axis - forward, tăng Z)
      else if (key === 's' && isAltPressed) {
        e.preventDefault();
        newPosition[2] += moveStep;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        onUpdateTestObjectPosition(newPosition);
      }
    }
  }, [selectedListenerId, selectedFurnitureId, isTestObjectSelected, testObjectPosition, listeners, furniture, onUpdateListener, onUpdateFurniture, onUpdateTestObjectPosition, moveStep]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex-1 relative">
      <Canvas
        camera={{ 
          position: [8, 5, 8], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' }}
        shadows
        onPointerMissed={(e) => {
          if (e.type === 'click') {
            setSelectedListenerId(null);
            setSelectedFurnitureId(null);
            // Không deselect test object khi click vào không gian trống
            // để người dùng có thể tiếp tục di chuyển bằng keyboard
          }
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Room */}
        <Room3D 
          length={dimensions.length} 
          width={dimensions.width} 
          height={dimensions.height}
          colors={colors}
        />

        {/* Furniture */}
        {furniture.map((item) => (
          <Furniture3D 
            key={item.id} 
            furniture={item}
            isSelected={selectedFurnitureId === item.id}
            onSelect={() => {
              setSelectedFurnitureId(item.id);
              setSelectedListenerId(null); // Deselect listener when selecting furniture
            }}
          />
        ))}

        {/* Listeners (Human avatars) */}
        {listeners.map((l) => (
          <ListenerAvatar3D 
            key={l.id} 
            listener={l}
            isSelected={selectedListenerId === l.id}
            onSelect={() => {
              setSelectedListenerId(l.id);
              setSelectedFurnitureId(null); // Deselect furniture when selecting listener
            }}
          />
        ))}

        {/* Speakers */}
        {speakers.map((speaker) => (
          <Speaker3D key={speaker.id} speaker={speaker} />
        ))}

        {/* Test Object - Movable object */}
        {testObjectPosition && (
          <TestObject3D 
            position={testObjectPosition}
            isSelected={isTestObjectSelected}
            onSelect={() => {
              if (onSelectTestObject) {
                onSelectTestObject();
              }
              // Deselect other objects when selecting test object
              setSelectedListenerId(null);
              setSelectedFurnitureId(null);
            }}
          />
        )}

        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={50}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Phòng 3D</div>
          <div className="text-xs">
            {furniture.length} nội thất • {speakers.length} loa • Sử dụng chuột để xoay/zoom
          </div>
          {isTestObjectSelected && testObjectPosition ? (
            <div className="text-xs mt-2 space-y-1">
              <div className="flex items-center gap-1 text-orange-600 font-semibold">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Vật thể test đã được chọn
              </div>
              <div className="text-orange-600 pl-3 space-y-0.5">
                <div>💡 W/S: Lên/Xuống</div>
                <div>💡 A/D: Trái/Phải</div>
                <div>💡 Alt+W: Vào trong</div>
                <div>💡 Alt+S: Ra phía trước</div>
              </div>
            </div>
          ) : selectedListenerId ? (
            <div className="text-xs mt-2 space-y-1">
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Listener đã được chọn
              </div>
              <div className="text-orange-600 pl-3 space-y-0.5">
                <div>💡 W/S: Lên/Xuống</div>
                <div>💡 A/D: Trái/Phải</div>
                <div>💡 Alt+W: Vào trong</div>
                <div>💡 Alt+S: Ra phía trước</div>
              </div>
            </div>
          ) : selectedFurnitureId ? (
            <div className="text-xs mt-2 space-y-1">
              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Nội thất đã được chọn
              </div>
              <div className="text-orange-600 pl-3 space-y-0.5">
                <div>💡 W/S: Lên/Xuống</div>
                <div>💡 A/D: Trái/Phải</div>
                <div>💡 Alt+W: Vào trong</div>
                <div>💡 Alt+S: Ra phía trước</div>
              </div>
            </div>
          ) : (listeners.length > 0 || furniture.length > 0 || testObjectPosition) && (
            <div className="text-xs mt-2 text-gray-500">
              💡 Click vào listener, nội thất hoặc vật thể test để chọn và di chuyển bằng phím
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas3D;
