import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ControlSection, ControlSectionInfo } from './index';

interface ControlNavigationProps {
  sections: ControlSectionInfo[];
  activeSection: ControlSection;
  onSectionChange: (section: ControlSection) => void;
}

const ControlNavigation: React.FC<ControlNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Thiết kế phòng âm thanh</h3>
      
      <nav className="space-y-1">
        {sections.map((section) => {
          const isActive = section.id === activeSection;
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-orange-100 border-2 border-orange-500 text-orange-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{section.icon}</span>
                <div className="text-left">
                  <h4 className={`font-medium ${isActive ? 'text-orange-700' : 'text-gray-800'}`}>
                    {section.title}
                  </h4>
                  <p className={`text-xs ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                    {section.description}
                  </p>
                </div>
              </div>
              
              {isActive && (
                <ChevronRight className="w-4 h-4 text-orange-600" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ControlNavigation;
