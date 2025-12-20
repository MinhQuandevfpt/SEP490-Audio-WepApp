import React, { useState, useCallback } from 'react';
import { 
  Header, 
  ControlsPanel, 
  Canvas3D
} from '../../../components/Design3DroomComponents';
import type { Dimensions, RoomColors, RoomPreset, Furniture, Listener, Speaker, CustomSpeakerSpecs } from '../../../components/Design3DroomComponents';

// Default colors
const DEFAULT_COLORS: RoomColors = {
  floor: '#8B4513',
  ceiling: '#F5F5DC',
  leftWall: '#D2B48C',
  rightWall: '#D2B48C',
  backWall: '#D2B48C'
};

const ThreeDRoom: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 5,
    width: 4,
    height: 3
  });

  const [colors, setColors] = useState<RoomColors>(DEFAULT_COLORS);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  // Selection states - quản lý object được chọn
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [selectedListenerId, setSelectedListenerId] = useState<string | null>(null);
  const [isTestObjectSelected, setIsTestObjectSelected] = useState<boolean>(false);
  // Test mode states - được sử dụng qua callbacks trong SpeakerDesignSection
  const [_testSpeaker, setTestSpeaker] = useState<CustomSpeakerSpecs | null>(null);
  const [testObjectPosition, setTestObjectPosition] = useState<[number, number, number] | null>(null);
  const [_isTestingIn3D, setIsTestingIn3D] = useState<boolean>(false);

  const handleDimensionChange = useCallback((key: keyof Dimensions, value: number) => {
    setDimensions(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(20, value)) // Giới hạn từ 1m đến 20m
    }));
  }, []);

  const handleColorChange = useCallback((wallType: keyof RoomColors, color: string) => {
    setColors(prev => ({
      ...prev,
      [wallType]: color
    }));
  }, []);

  const handlePresetSelect = useCallback((preset: RoomPreset) => {
    setDimensions(preset.dimensions);
    setColors(preset.colors);
  }, []);

  const resetDimensions = useCallback(() => {
    setDimensions({ length: 5, width: 4, height: 3 });
    setColors(DEFAULT_COLORS);
  }, []);

  // Helper function để giới hạn vị trí trong phòng
  const clampPositionToRoom = useCallback((position: [number, number, number], objectSize: number = 0.3): [number, number, number] => {
    const halfLength = dimensions.length / 2;
    const halfWidth = dimensions.width / 2;
    const halfObjectSize = objectSize / 2;
    
    // Giới hạn X: -length/2 + objectSize/2 đến +length/2 - objectSize/2
    const minX = -halfLength + halfObjectSize;
    const maxX = halfLength - halfObjectSize;
    
    // Giới hạn Y: objectSize/2 đến height - objectSize/2
    const minY = halfObjectSize;
    const maxY = dimensions.height - halfObjectSize;
    
    // Giới hạn Z: -width/2 + objectSize/2 đến +width/2 - objectSize/2
    const minZ = -halfWidth + halfObjectSize;
    const maxZ = halfWidth - halfObjectSize;
    
    return [
      Math.max(minX, Math.min(maxX, position[0])),
      Math.max(minY, Math.min(maxY, position[1])),
      Math.max(minZ, Math.min(maxZ, position[2]))
    ];
  }, [dimensions]);

  // Furniture handlers
  const handleAddFurniture = useCallback((newFurniture: Omit<Furniture, 'id'>) => {
    const furnitureItem: Furniture = {
      ...newFurniture,
      id: `furniture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setFurniture(prev => [...prev, furnitureItem]);
  }, []);

  const handleRemoveFurniture = useCallback((id: string) => {
    setFurniture(prev => prev.filter(item => item.id !== id));
    // Deselect nếu đang chọn furniture này
    if (selectedFurnitureId === id) {
      setSelectedFurnitureId(null);
    }
  }, [selectedFurnitureId]);

  const handleUpdateFurniture = useCallback((id: string, updates: Partial<Furniture>) => {
    setFurniture(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Listener handlers
  const handleAddListener = useCallback((newListener: Omit<Listener, 'id'>) => {
    // Giới hạn vị trí ban đầu của listener trong phòng (người có kích thước ~0.5m)
    const clampedPosition = clampPositionToRoom(newListener.position, 0.5);
    const listener: Listener = {
      ...newListener,
      position: clampedPosition,
      id: `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setListeners(prev => [...prev, listener]);
  }, [clampPositionToRoom]);

  const handleRemoveListener = useCallback((id: string) => {
    setListeners(prev => prev.filter(item => item.id !== id));
    // Deselect nếu đang chọn listener này
    if (selectedListenerId === id) {
      setSelectedListenerId(null);
    }
  }, [selectedListenerId]);

  const handleUpdateListener = useCallback((id: string, updates: Partial<Listener>) => {
    setListeners(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Nếu có cập nhật position, giới hạn trong phòng (người có kích thước ~0.5m)
        if (updates.position) {
          updatedItem.position = clampPositionToRoom(updates.position, 0.5);
        }
        return updatedItem;
      }
      return item;
    }));
  }, [clampPositionToRoom]);

  // Selection handlers - mutual exclusion
  const handleSelectFurniture = useCallback((id: string | null) => {
    setSelectedFurnitureId(id);
    // Deselect listener và test object khi chọn furniture
    if (id !== null) {
      setSelectedListenerId(null);
      setIsTestObjectSelected(false);
    }
  }, []);

  const handleSelectListener = useCallback((id: string | null) => {
    setSelectedListenerId(id);
    // Deselect furniture và test object khi chọn listener
    if (id !== null) {
      setSelectedFurnitureId(null);
      setIsTestObjectSelected(false);
    }
  }, []);

  // Test object selection handler
  const handleSelectTestObject = useCallback(() => {
    setIsTestObjectSelected(prev => !prev); // Toggle selection
    // Deselect other objects when selecting test object
    if (!isTestObjectSelected) {
      setSelectedFurnitureId(null);
      setSelectedListenerId(null);
    }
  }, [isTestObjectSelected]);

  // Update test object position handler
  const handleUpdateTestObjectPosition = useCallback((position: [number, number, number]) => {
    // Giới hạn vị trí test object trong phòng (test object có kích thước ~0.2m)
    const clampedPosition = clampPositionToRoom(position, 0.2);
    setTestObjectPosition(clampedPosition);
  }, [clampPositionToRoom]);

  // Speaker handlers
  const handleAddSpeaker = useCallback((newSpeaker: Omit<Speaker, 'id'>) => {
    // Giới hạn vị trí ban đầu của speaker trong phòng (speaker có kích thước ~0.3m)
    const clampedPosition = clampPositionToRoom(newSpeaker.position, 0.3);
    const speaker: Speaker = {
      ...newSpeaker,
      position: clampedPosition,
      id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setSpeakers(prev => [...prev, speaker]);
  }, [clampPositionToRoom]);

  const handleRemoveSpeaker = useCallback((id: string) => {
    setSpeakers(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateSpeaker = useCallback((id: string, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        // Nếu có cập nhật position, giới hạn trong phòng (speaker có kích thước ~0.3m)
        if (updates.position) {
          updatedItem.position = clampPositionToRoom(updates.position, 0.3);
        }
        return updatedItem;
      }
      return item;
    }));
  }, [clampPositionToRoom]);

  try {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />

        <div className="flex h-[calc(100vh-80px)]">
          <ControlsPanel
            dimensions={dimensions}
            colors={colors}
            furniture={furniture}
            onDimensionChange={handleDimensionChange}
            onColorChange={handleColorChange}
            onPresetSelect={handlePresetSelect}
            onReset={resetDimensions}
            onAddFurniture={handleAddFurniture}
            onRemoveFurniture={handleRemoveFurniture}
            onUpdateFurniture={handleUpdateFurniture}
            listeners={listeners}
            onAddListener={handleAddListener}
            onRemoveListener={handleRemoveListener}
            onUpdateListener={handleUpdateListener}
            speakers={speakers}
            onAddSpeaker={handleAddSpeaker}
            onRemoveSpeaker={handleRemoveSpeaker}
            onUpdateSpeaker={handleUpdateSpeaker}
            onTestSpeaker={setTestSpeaker}
            onTestObjectPositionChange={setTestObjectPosition}
            onTestingIn3DChange={setIsTestingIn3D}
            selectedFurnitureId={selectedFurnitureId}
            onSelectFurniture={handleSelectFurniture}
            selectedListenerId={selectedListenerId}
            onSelectListener={handleSelectListener}
            isTestObjectSelected={isTestObjectSelected}
            onSelectTestObject={handleSelectTestObject}
          />

          <Canvas3D 
            dimensions={dimensions} 
            colors={colors} 
            furniture={furniture}
            listeners={listeners}
            speakers={speakers}
            testObjectPosition={testObjectPosition}
            onUpdateListener={handleUpdateListener}
            onUpdateFurniture={handleUpdateFurniture}
            onUpdateTestObjectPosition={handleUpdateTestObjectPosition}
            selectedFurnitureId={selectedFurnitureId}
            onSelectFurniture={handleSelectFurniture}
            selectedListenerId={selectedListenerId}
            onSelectListener={handleSelectListener}
            isTestObjectSelected={isTestObjectSelected}
            onSelectTestObject={handleSelectTestObject}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering ThreeDRoom:', error);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi khi tải trang</h1>
          <p className="text-gray-600">Vui lòng tải lại trang hoặc liên hệ hỗ trợ</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
};

export default ThreeDRoom;