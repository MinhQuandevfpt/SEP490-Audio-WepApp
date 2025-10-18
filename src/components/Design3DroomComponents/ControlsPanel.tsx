import React, { useState } from 'react';
import ControlNavigation from './ControlNavigation';
import RoomDesignSection from './RoomDesignSection';
import FurnitureDesignSection from './FurnitureDesignSection';
import SpeakerDesignSection from './SpeakerDesignSection';
import ListenerDesignSection from './ListenerDesignSection';
import Instructions from './Instructions';
import { CONTROL_SECTIONS } from './index';
import type { 
  Dimensions, 
  RoomColors, 
  RoomPreset, 
  ControlSection, 
  Furniture,
  Speaker,
  Listener
} from './index';

interface ControlsPanelProps {
  dimensions: Dimensions;
  colors: RoomColors;
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onColorChange: (wallType: keyof RoomColors, color: string) => void;
  onPresetSelect: (preset: RoomPreset) => void;
  onReset: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  dimensions,
  colors,
  onDimensionChange,
  onColorChange,
  onPresetSelect,
  onReset
}) => {
  const [activeSection, setActiveSection] = useState<ControlSection>('room');
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);

  // Furniture handlers
  const handleAddFurniture = (newFurniture: Omit<Furniture, 'id'>) => {
    const furniture: Furniture = {
      ...newFurniture,
      id: `furniture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setFurniture(prev => [...prev, furniture]);
  };

  const handleRemoveFurniture = (id: string) => {
    setFurniture(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateFurniture = (id: string, updates: Partial<Furniture>) => {
    setFurniture(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Speaker handlers
  const handleAddSpeaker = (newSpeaker: Omit<Speaker, 'id'>) => {
    const speaker: Speaker = {
      ...newSpeaker,
      id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setSpeakers(prev => [...prev, speaker]);
  };

  const handleRemoveSpeaker = (id: string) => {
    setSpeakers(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateSpeaker = (id: string, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Listener handlers
  const handleAddListener = (newListener: Omit<Listener, 'id'>) => {
    const listener: Listener = {
      ...newListener,
      id: `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setListeners(prev => [...prev, listener]);
  };

  const handleRemoveListener = (id: string) => {
    setListeners(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateListener = (id: string, updates: Partial<Listener>) => {
    setListeners(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'room':
        return (
          <RoomDesignSection
            dimensions={dimensions}
            colors={colors}
            onDimensionChange={onDimensionChange}
            onColorChange={onColorChange}
            onPresetSelect={onPresetSelect}
            onReset={onReset}
          />
        );
      case 'furniture':
        return (
          <FurnitureDesignSection
            furniture={furniture}
            onAddFurniture={handleAddFurniture}
            onRemoveFurniture={handleRemoveFurniture}
            onUpdateFurniture={handleUpdateFurniture}
          />
        );
      case 'speakers':
        return (
          <SpeakerDesignSection
            speakers={speakers}
            onAddSpeaker={handleAddSpeaker}
            onRemoveSpeaker={handleRemoveSpeaker}
            onUpdateSpeaker={handleUpdateSpeaker}
          />
        );
      case 'listeners':
        return (
          <ListenerDesignSection
            listeners={listeners}
            onAddListener={handleAddListener}
            onRemoveListener={handleRemoveListener}
            onUpdateListener={handleUpdateListener}
          />
        );
      default:
        return null;
    }
  };

  try {
    return (
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          <ControlNavigation
            sections={CONTROL_SECTIONS}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          
          {renderActiveSection()}
          
          <Instructions />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering ControlsPanel:', error);
    return (
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 p-6">
        <div className="text-red-600">Lỗi khi tải panel điều khiển</div>
      </div>
    );
  }
};

export default ControlsPanel;
