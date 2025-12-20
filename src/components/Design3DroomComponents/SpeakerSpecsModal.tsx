import React from 'react';
import { X, Download, Copy } from 'lucide-react';
import type { CustomSpeakerSpecs } from './index';

interface SpeakerSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: CustomSpeakerSpecs;
  speakerName?: string;
}

const SpeakerSpecsModal: React.FC<SpeakerSpecsModalProps> = ({
  isOpen,
  onClose,
  specs,
  speakerName = 'Loa tùy chỉnh'
}) => {
  if (!isOpen) return null;

  // Format JSON để hiển thị và export
  const specsData = {
    ten: speakerName,
    thongSoKyThuat: {
      // Frequency Response
      daiTanSo: {
        tanSoThap: `${specs.frequencyLow} Hz`,
        tanSoCao: `${specs.frequencyHigh} Hz`,
        daiTanSo: `${specs.frequencyLow}Hz - ${specs.frequencyHigh}Hz`
      },
      // Power
      congSuat: `${specs.power}W`,
      // Impedance
      troKhang: `${specs.impedance}Ω`,
      // Sensitivity
      doNhay: `${specs.sensitivity} dB/W/m`,
      // EQ Adjustments
      dieuChinhEQ: {
        bass: `${specs.bassBoost > 0 ? '+' : ''}${specs.bassBoost} dB`,
        mid: `${specs.midBoost > 0 ? '+' : ''}${specs.midBoost} dB`,
        treble: `${specs.trebleBoost > 0 ? '+' : ''}${specs.trebleBoost} dB`
      },
      // THD
      doMeoTieng: `${specs.thd}%`,
      // Crossover Frequency
      tanSoCrossover: specs.crossoverFrequency ? `${specs.crossoverFrequency} Hz` : 'Không có'
    }
  };

  const specsJson = JSON.stringify(specsData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(specsJson).then(() => {
      alert('Đã sao chép thông số vào clipboard!');
    }).catch(() => {
      alert('Không thể sao chép. Vui lòng thử lại.');
    });
  };

  const handleDownload = () => {
    const blob = new Blob([specsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thong-so-loa-${speakerName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50">
          <h2 className="text-xl font-semibold text-gray-800">📊 Thông số kỹ thuật loa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Speaker Name */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">🔊 Tên loa</h3>
              <p className="text-gray-800 font-medium">{speakerName}</p>
            </div>

            {/* Frequency Response */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📡 Dải tần số (Frequency Response)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Tần số thấp (Bass):</span>
                  <span className="font-semibold text-blue-700">{specs.frequencyLow} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tần số cao (Treble):</span>
                  <span className="font-semibold text-blue-700">{specs.frequencyHigh} Hz</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-gray-700 font-medium">Dải tần số:</span>
                  <span className="font-bold text-blue-800">{specs.frequencyLow}Hz - {specs.frequencyHigh}Hz</span>
                </div>
              </div>
            </div>

            {/* Power */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">⚡ Công suất (Power)</h3>
              <div className="text-2xl font-bold text-green-700">{specs.power}W</div>
              <p className="text-xs text-gray-600 mt-1">Công suất định mức</p>
            </div>

            {/* Impedance */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">🔌 Trở kháng (Impedance)</h3>
              <div className="text-2xl font-bold text-purple-700">{specs.impedance}Ω</div>
              <p className="text-xs text-gray-600 mt-1">Trở kháng danh định</p>
            </div>

            {/* Sensitivity */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">🎯 Độ nhạy (Sensitivity)</h3>
              <div className="text-2xl font-bold text-yellow-700">{specs.sensitivity} dB/W/m</div>
              <p className="text-xs text-gray-600 mt-1">Độ nhạy âm thanh</p>
            </div>

            {/* EQ Adjustments */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">🎚️ Điều chỉnh EQ (dB)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Bass:</span>
                  <span className={`font-semibold ${specs.bassBoost > 0 ? 'text-green-600' : specs.bassBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.bassBoost > 0 ? '+' : ''}{specs.bassBoost} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Mid:</span>
                  <span className={`font-semibold ${specs.midBoost > 0 ? 'text-green-600' : specs.midBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.midBoost > 0 ? '+' : ''}{specs.midBoost} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Treble:</span>
                  <span className={`font-semibold ${specs.trebleBoost > 0 ? 'text-green-600' : specs.trebleBoost < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {specs.trebleBoost > 0 ? '+' : ''}{specs.trebleBoost} dB
                  </span>
                </div>
              </div>
            </div>

            {/* THD */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-3">📉 Độ méo tiếng (THD)</h3>
              <div className="text-2xl font-bold text-red-700">{specs.thd}%</div>
              <p className="text-xs text-gray-600 mt-1">Total Harmonic Distortion</p>
            </div>

            {/* Crossover Frequency */}
            {specs.crossoverFrequency && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">🔀 Tần số Crossover</h3>
                <div className="text-2xl font-bold text-indigo-700">{specs.crossoverFrequency} Hz</div>
                <p className="text-xs text-gray-600 mt-1">Tần số phân tách cho loa đa driver</p>
              </div>
            )}

            {/* JSON Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📄 Dữ liệu JSON</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {specsJson}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Thông số kỹ thuật của loa tùy chỉnh
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Sao chép</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerSpecsModal;

