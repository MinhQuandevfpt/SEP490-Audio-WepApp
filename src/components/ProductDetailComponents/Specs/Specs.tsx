import React from 'react';
import { Zap, Battery, Plug, Ruler } from 'lucide-react';

interface SpecsProps {
  specs: Array<{ key: string; value: string }>;
}

const Specs: React.FC<SpecsProps> = ({ specs }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông số kỹ thuật</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {specs.map((s, idx) => {
          const icon =
            s.key.toLowerCase().includes('công suất') ? (
              <Zap className="w-4 h-4 text-yellow-600" />
            ) : s.key.toLowerCase().includes('pin') ? (
              <Battery className="w-4 h-4 text-green-600" />
            ) : s.key.toLowerCase().includes('kết nối') ? (
              <Plug className="w-4 h-4 text-blue-600" />
            ) : s.key.toLowerCase().includes('kích thước') ? (
              <Ruler className="w-4 h-4 text-purple-600" />
            ) : null;
          return (
            <div key={idx} className="flex items-start gap-2 py-2 border-b last:border-0 border-gray-100">
              <div className="w-40 text-gray-500 flex items-center gap-2">
                {icon}
                {s.key}
              </div>
              <div className="flex-1 font-medium text-gray-900">{s.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Specs;


