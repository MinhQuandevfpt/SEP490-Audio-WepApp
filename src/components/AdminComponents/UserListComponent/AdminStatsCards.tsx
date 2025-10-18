import React from 'react';

interface StatItem {
  title: string;
  value: number;
  change: string;
  changeType: 'increase' | 'decrease';
  color: 'blue' | 'green' | 'purple' | 'red';
  icon: React.ReactNode;
}

interface AdminStatsCardsProps {
  statsLoading: boolean;
  items: StatItem[];
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ statsLoading, items }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statsLoading ? (
        Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))
      ) : (
        items.map((stat, index) => (
          <div key={index} className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</p>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stat.changeType === 'increase' ? '↗' : '↘'} {stat.change}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">so với tháng trước</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                stat.color === 'green' ? 'bg-green-100 text-green-600' :
                stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-red-100 text-red-600'
              } group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminStatsCards;


