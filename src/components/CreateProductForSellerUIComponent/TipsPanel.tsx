import React from 'react';

interface TipsPanelProps {
  title?: string;
  items: { label: string; done: boolean }[];
  tips?: { title: string; content: string }[];
}

const TipsPanel: React.FC<TipsPanelProps> = ({ title = 'Gợi ý điền Thông tin', items, tips = [] }) => {
  return (
    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-4">
      <div className="text-sm font-semibold text-gray-800 mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center text-sm">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 ${i.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{i.done ? '✓' : '•'}</span>
            <span className={i.done ? 'text-gray-600 line-through' : 'text-gray-700'}>{i.label}</span>
          </li>
        ))}
      </ul>
      {tips.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-gray-800 mb-2">Gợi ý</div>
          <div className="space-y-3">
            {tips.map((t, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-800">{t.title}</div>
                <div className="text-xs text-blue-700 mt-1">{t.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TipsPanel;


