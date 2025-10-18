import React from 'react';
import { TicketPercent, X } from 'lucide-react';

interface VoucherSectionProps {
  voucherInput: string;
  appliedVoucher: { code: string } | null;
  availableVouchers: Array<{ code: string; label: string; desc: string }>;
  onChangeInput: (v: string) => void;
  onApply: () => void;
  onChoose: (code: string) => void;
  onClear: () => void;
}

const VoucherSection: React.FC<VoucherSectionProps> = ({ voucherInput, appliedVoucher, availableVouchers, onChangeInput, onApply, onChoose, onClear }) => {
  return (
    <div className="pt-2">
      <p className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><TicketPercent className="w-4 h-4 text-orange-600" /> Mã giảm giá</p>
      <div className="flex gap-2">
        <input
          value={voucherInput}
          onChange={(e) => onChangeInput(e.target.value)}
          placeholder="Nhập mã (GIAM10, FREESHIP)"
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={onApply}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black"
        >
          Áp dụng
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2">
        {availableVouchers.map(v => (
          <button
            key={v.code}
            onClick={() => onChoose(v.code)}
            className={`w-full text-left border rounded-lg px-3 py-2 flex items-center justify-between ${appliedVoucher?.code === v.code ? 'border-orange-400 bg-orange-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{v.label}</p>
              <p className="text-xs text-gray-500">{v.desc}</p>
            </div>
            {appliedVoucher?.code === v.code && (
              <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </button>
        ))}
      </div>

      {appliedVoucher && (
        <div className="mt-2 flex items-center justify-between bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded">
          <span className="text-sm">Đã áp dụng: {appliedVoucher.code}</span>
          <button onClick={onClear} className="text-sm underline">Gỡ</button>
        </div>
      )}
    </div>
  );
};

export default VoucherSection;


