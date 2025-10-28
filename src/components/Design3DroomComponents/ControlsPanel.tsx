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
  furniture: Furniture[];
  onDimensionChange: (key: keyof Dimensions, value: number) => void;
  onColorChange: (wallType: keyof RoomColors, color: string) => void;
  onPresetSelect: (preset: RoomPreset) => void;
  onReset: () => void;
  onAddFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  onRemoveFurniture: (id: string) => void;
  onUpdateFurniture: (id: string, updates: Partial<Furniture>) => void;
  // listeners
  listeners: Listener[];
  onAddListener: (listener: Omit<Listener, 'id'>) => void;
  onRemoveListener: (id: string) => void;
  onUpdateListener: (id: string, updates: Partial<Listener>) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  dimensions,
  colors,
  furniture,
  onDimensionChange,
  onColorChange,
  onPresetSelect,
  onReset,
  onAddFurniture,
  onRemoveFurniture,
  onUpdateFurniture,
  listeners,
  onAddListener,
  onRemoveListener,
  onUpdateListener
}) => {
  const [activeSection, setActiveSection] = useState<ControlSection>('room');
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

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

  // Listener handlers are received from parent (3DRoom)

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
            onAddFurniture={onAddFurniture}
            onRemoveFurniture={onRemoveFurniture}
            onUpdateFurniture={onUpdateFurniture}
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
            onAddListener={onAddListener}
            onRemoveListener={onRemoveListener}
            onUpdateListener={onUpdateListener}
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
