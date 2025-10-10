import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface HighlightsProps {
  highlights: string[];
}

const Highlights: React.FC<HighlightsProps> = ({ highlights }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Nổi bật</h3>
      <ul className="space-y-2">
        {highlights.map((h, idx) => (
          <li key={idx} className="flex items-start gap-2 text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <span className="leading-relaxed">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Highlights;


