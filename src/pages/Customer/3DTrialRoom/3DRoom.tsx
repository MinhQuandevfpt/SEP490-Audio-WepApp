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
  }, []);

  const handleUpdateFurniture = useCallback((id: string, updates: Partial<Furniture>) => {
    setFurniture(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Listener handlers
  const handleAddListener = useCallback((newListener: Omit<Listener, 'id'>) => {
    const listener: Listener = {
      ...newListener,
      id: `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setListeners(prev => [...prev, listener]);
  }, []);

  const handleRemoveListener = useCallback((id: string) => {
    setListeners(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateListener = useCallback((id: string, updates: Partial<Listener>) => {
    setListeners(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Speaker handlers
  const handleAddSpeaker = useCallback((newSpeaker: Omit<Speaker, 'id'>) => {
    const speaker: Speaker = {
      ...newSpeaker,
      id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setSpeakers(prev => [...prev, speaker]);
  }, []);

  const handleRemoveSpeaker = useCallback((id: string) => {
    setSpeakers(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUpdateSpeaker = useCallback((id: string, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

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