import React from 'react';

interface StepActionsBarProps {
  step: number;
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const StepActionsBar: React.FC<StepActionsBarProps> = ({ step, total, canSubmit, submitting, onPrev, onNext }) => {
  const isLast = step === total - 1;
  return (
    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-4 flex items-center justify-between sticky top-4">
      <div className="text-sm text-gray-500">Bước {step + 1} / {total}</div>
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={onPrev} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Quay lại</button>
        )}
        {!isLast && (
          <button type="button" onClick={onNext} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Tiếp tục</button>
        )}
        {isLast && (
          <button type="submit" disabled={!canSubmit || submitting} className={`px-4 py-2 rounded-lg text-white ${!canSubmit || submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{submitting ? 'Đang lưu...' : 'Lưu nháp'}</button>
        )}
      </div>
    </div>
  );
};

export default StepActionsBar;


