import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { 
  Header, 
  ControlsPanel, 
  Canvas3D
} from '../../../components/Design3DroomComponents';
import type { Dimensions } from '../../../components/Design3DroomComponents';

const ThreeDRoom: React.FC = () => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 5,
    width: 4,
    height: 3
  });

  const [isControlsOpen, setIsControlsOpen] = useState(true);

  const handleDimensionChange = (key: keyof Dimensions, value: number) => {
    setDimensions(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(20, value)) // Giới hạn từ 1m đến 20m
    }));
  };

  const resetDimensions = () => {
    setDimensions({ length: 5, width: 4, height: 3 });
  };

  const toggleControls = () => {
    setIsControlsOpen(!isControlsOpen);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <Header 
          isControlsOpen={isControlsOpen}
          onToggleControls={toggleControls}
        />

        <div className="flex h-[calc(100vh-80px)]">
          <ControlsPanel
            isOpen={isControlsOpen}
            dimensions={dimensions}
            onDimensionChange={handleDimensionChange}
            onReset={resetDimensions}
          />

          <Canvas3D dimensions={dimensions} />
        </div>
      </div>
    </Layout>
  );
};

export default ThreeDRoom;