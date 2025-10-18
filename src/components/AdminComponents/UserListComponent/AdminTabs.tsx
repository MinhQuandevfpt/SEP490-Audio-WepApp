import React from 'react';

interface TabItem {
  id: 'customers' | 'sellers' | 'admins';
  name: string;
  count: number;
}

interface AdminTabsProps {
  activeTab: 'customers' | 'sellers' | 'admins';
  tabs: TabItem[];
  onChange: (id: TabItem['id']) => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, tabs, onChange }) => {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
      <nav className="flex space-x-1 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'bg-white text-blue-600 border-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            } relative flex items-center px-6 py-4 font-medium text-sm rounded-t-lg border border-b-0 transition-all duration-200 group`}
          >
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                {tab.id === 'customers' && '👥'}
                {tab.id === 'sellers' && '🏪'}
                {tab.id === 'admins' && '👨‍💼'}
                <span className="ml-2">{tab.name}</span>
              </span>
              <span className={`${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
              } inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors duration-200`}>
                {tab.count}
              </span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminTabs;


