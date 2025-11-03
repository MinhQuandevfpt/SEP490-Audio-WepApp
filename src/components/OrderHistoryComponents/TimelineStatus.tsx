import React from 'react';

interface Props {
  items: Array<{ label: string; date: string; done: boolean }>;
}

const TimelineStatus: React.FC<Props> = ({ items }) => {
  return (
    <div className="space-y-3">
      {items.map((s, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className={`w-3 h-3 mt-1 rounded-full ${s.done ? 'bg-orange-500' : 'bg-gray-300'}`} />
          <div>
            <p className="text-sm text-gray-900">{s.label}</p>
            <p className="text-xs text-gray-500">{s.date ? new Date(s.date).toLocaleString('vi-VN') : '-'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineStatus;


