import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  // Không cần props nào nữa
}

const Header: React.FC<HeaderProps> = () => {
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
            <div className="text-right">
              <p className="text-sm text-gray-600">Thiết kế phòng âm thanh</p>
              <p className="text-xs text-gray-500">Tùy chỉnh kích thước và màu sắc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
