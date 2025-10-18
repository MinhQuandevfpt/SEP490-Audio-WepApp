import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

interface HeaderProps {
  isControlsOpen: boolean;
  onToggleControls: () => void;
}

const Header: React.FC<HeaderProps> = ({ isControlsOpen, onToggleControls }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Trải nghiệm phòng âm thanh 3D
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleControls}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              {isControlsOpen ? 'Ẩn điều khiển' : 'Hiện điều khiển'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
