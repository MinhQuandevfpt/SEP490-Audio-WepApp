import React from 'react';

export interface StepItem {
  key: string;
  title: string;
  subtitle?: string;
}

interface StepperProps {
  steps: StepItem[];
  current: number;
  onStepClick?: (index: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, current, onStepClick }) => {
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center w-full">
        {steps.map((s, idx) => {
          const isActive = idx === current;
          const isDone = idx < current;
          return (
            <li key={s.key} className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(idx)}
                className={`flex items-center w-full group text-left`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                  isDone ? 'bg-green-500 border-green-500 text-white' : isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>{s.title}</div>
                  {s.subtitle && (
                    <div className="text-xs text-gray-500">{s.subtitle}</div>
                  )}
                </div>
              </button>
              {idx !== steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Stepper;


