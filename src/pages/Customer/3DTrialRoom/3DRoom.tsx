import React, { useState, useCallback } from 'react';
import Layout from '../../../components/Layout';
import { 
  Header, 
  ControlsPanel, 
  Canvas3D
} from '../../../components/Design3DroomComponents';
import type { Dimensions, RoomColors, RoomPreset, Furniture } from '../../../components/Design3DroomComponents';

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

  try {
    return (
      <Layout>
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
            />

            <Canvas3D 
              dimensions={dimensions} 
              colors={colors} 
              furniture={furniture}
            />
          </div>
        </div>
      </Layout>
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