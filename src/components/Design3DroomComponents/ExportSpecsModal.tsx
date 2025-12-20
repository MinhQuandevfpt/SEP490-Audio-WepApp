import React from 'react';
import { X, Download, Copy } from 'lucide-react';
import type { Dimensions, RoomColors, Furniture, Listener, Speaker } from './index';

interface ExportSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: Dimensions;
  colors: RoomColors;
  furniture: Furniture[];
  listeners: Listener[];
  speakers: Speaker[];
  testObjectPosition?: [number, number, number] | null;
}

const ExportSpecsModal: React.FC<ExportSpecsModalProps> = ({
  isOpen,
  onClose,
  dimensions,
  colors,
  furniture,
  listeners,
  speakers,
  testObjectPosition
}) => {
  if (!isOpen) return null;

  // Tính toán thông tin phòng
  const area = dimensions.length * dimensions.width;
  const volume = dimensions.length * dimensions.width * dimensions.height;
  const perimeter = (dimensions.length + dimensions.width) * 2;

  // Format JSON để hiển thị
  const specsData = {
    phong: {
      kichThuoc: {
        chieuDai: `${dimensions.length}m`,
        chieuRong: `${dimensions.width}m`,
        chieuCao: `${dimensions.height}m`,
        dienTich: `${area.toFixed(2)}m²`,
        theTich: `${volume.toFixed(2)}m³`,
        chuVi: `${perimeter.toFixed(2)}m`
      },
      mauSac: {
        san: colors.floor,
        tran: colors.ceiling,
        tuongTrai: colors.leftWall,
        tuongPhai: colors.rightWall,
        tuongSau: colors.backWall
      }
    },
    noiThat: furniture.map(f => ({
      ten: f.name,
      loai: f.type,
      viTri: {
        x: `${f.position[0].toFixed(2)}m`,
        y: `${f.position[1].toFixed(2)}m`,
        z: `${f.position[2].toFixed(2)}m`
      },
      kichThuoc: {
        x: `${f.scale[0].toFixed(2)}`,
        y: `${f.scale[1].toFixed(2)}`,
        z: `${f.scale[2].toFixed(2)}`
      },
      mauSac: f.color
    })),
    nguoiNghe: listeners.map(l => ({
      ten: l.name,
      viTri: {
        x: `${l.position[0].toFixed(2)}m`,
        y: `${l.position[1].toFixed(2)}m`,
        z: `${l.position[2].toFixed(2)}m`
      },
      xoay: {
        x: `${(l.rotation[0] * 180 / Math.PI).toFixed(1)}°`,
        y: `${(l.rotation[1] * 180 / Math.PI).toFixed(1)}°`,
        z: `${(l.rotation[2] * 180 / Math.PI).toFixed(1)}°`
      },
      trangThai: l.isActive ? 'Hoạt động' : 'Không hoạt động'
    })),
    loa: speakers.map(s => ({
      ten: s.name,
      loai: s.type,
      viTri: {
        x: `${s.position[0].toFixed(2)}m`,
        y: `${s.position[1].toFixed(2)}m`,
        z: `${s.position[2].toFixed(2)}m`
      },
      xoay: {
        x: `${(s.rotation[0] * 180 / Math.PI).toFixed(1)}°`,
        y: `${(s.rotation[1] * 180 / Math.PI).toFixed(1)}°`,
        z: `${(s.rotation[2] * 180 / Math.PI).toFixed(1)}°`
      },
      mauSac: s.color,
      congSuat: `${s.power}W`,
      chatLuong: s.quality,
      dangPhat: s.isPlaying ? 'Có' : 'Không',
      amLuong: s.volume !== undefined ? `${Math.round((s.volume ?? 0) * 100)}%` : '100%',
      thongSoTuyChinh: s.customSpecs ? {
        tanSoThap: `${s.customSpecs.frequencyLow}Hz`,
        tanSoCao: `${s.customSpecs.frequencyHigh}Hz`,
        congSuat: `${s.customSpecs.power}W`,
        troKhang: `${s.customSpecs.impedance}Ω`,
        doNhay: `${s.customSpecs.sensitivity}dB`,
        bassBoost: `${s.customSpecs.bassBoost > 0 ? '+' : ''}${s.customSpecs.bassBoost}dB`,
        midBoost: `${s.customSpecs.midBoost > 0 ? '+' : ''}${s.customSpecs.midBoost}dB`,
        trebleBoost: `${s.customSpecs.trebleBoost > 0 ? '+' : ''}${s.customSpecs.trebleBoost}dB`,
        thd: `${s.customSpecs.thd}%`,
        crossoverFrequency: `${s.customSpecs.crossoverFrequency}Hz`
      } : null,
      thongSoAmThanh: {
        refDistance: s.refDistance ? `${s.refDistance}m` : '1.2m (mặc định)',
        maxDistance: s.maxDistance ? `${s.maxDistance}m` : '12m (mặc định)',
        rolloffFactor: s.rolloffFactor ?? 1,
        coneInnerAngle: s.coneInnerAngle ? `${s.coneInnerAngle}°` : '60° (mặc định)',
        coneOuterAngle: s.coneOuterAngle ? `${s.coneOuterAngle}°` : '120° (mặc định)',
        coneOuterGain: s.coneOuterGain ? `${Math.round((s.coneOuterGain ?? 0) * 100)}%` : '30% (mặc định)'
      }
    })),
    vatTheTest: testObjectPosition ? {
      viTri: {
        x: `${testObjectPosition[0].toFixed(2)}m`,
        y: `${testObjectPosition[1].toFixed(2)}m`,
        z: `${testObjectPosition[2].toFixed(2)}m`
      }
    } : null
  };

  const specsJson = JSON.stringify(specsData, null, 2);

  const handleCopyToClipboard = () => {
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
    a.download = `thong-so-phong-am-thanh-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Xuất thông số phòng âm thanh</h2>
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
            {/* Thông tin phòng */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📐 Thông tin phòng</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Chiều dài:</span>
                  <span className="ml-2 text-gray-900">{dimensions.length}m</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chiều rộng:</span>
                  <span className="ml-2 text-gray-900">{dimensions.width}m</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chiều cao:</span>
                  <span className="ml-2 text-gray-900">{dimensions.height}m</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Diện tích:</span>
                  <span className="ml-2 text-gray-900">{area.toFixed(2)}m²</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Thể tích:</span>
                  <span className="ml-2 text-gray-900">{volume.toFixed(2)}m³</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chu vi:</span>
                  <span className="ml-2 text-gray-900">{perimeter.toFixed(2)}m</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300">
                <h4 className="font-medium text-blue-800 mb-2">Màu sắc:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colors.floor }}></div>
                    <span>Sàn: {colors.floor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colors.ceiling }}></div>
                    <span>Trần: {colors.ceiling}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colors.leftWall }}></div>
                    <span>Tường trái: {colors.leftWall}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colors.rightWall }}></div>
                    <span>Tường phải: {colors.rightWall}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colors.backWall }}></div>
                    <span>Tường sau: {colors.backWall}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nội thất */}
            {furniture.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-3">🪑 Nội thất ({furniture.length})</h3>
                <div className="space-y-3">
                  {furniture.map((f) => (
                    <div key={f.id} className="bg-white rounded p-3 border border-green-300">
                      <div className="font-medium text-gray-800">{f.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Loại: {f.type}</div>
                        <div>Vị trí: ({f.position[0].toFixed(2)}, {f.position[1].toFixed(2)}, {f.position[2].toFixed(2)})m</div>
                        <div>Kích thước: ({f.scale[0].toFixed(2)}, {f.scale[1].toFixed(2)}, {f.scale[2].toFixed(2)})</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-3 h-3 rounded border border-gray-300" style={{ backgroundColor: f.color }}></div>
                          <span>Màu: {f.color}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Người nghe */}
            {listeners.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">👥 Người nghe ({listeners.length})</h3>
                <div className="space-y-3">
                  {listeners.map((l) => (
                    <div key={l.id} className="bg-white rounded p-3 border border-purple-300">
                      <div className="font-medium text-gray-800">{l.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Vị trí: ({l.position[0].toFixed(2)}, {l.position[1].toFixed(2)}, {l.position[2].toFixed(2)})m</div>
                        <div>Xoay: ({(l.rotation[0] * 180 / Math.PI).toFixed(1)}°, {(l.rotation[1] * 180 / Math.PI).toFixed(1)}°, {(l.rotation[2] * 180 / Math.PI).toFixed(1)}°)</div>
                        <div>Trạng thái: <span className={l.isActive ? 'text-green-600 font-medium' : 'text-gray-500'}>{l.isActive ? 'Hoạt động' : 'Không hoạt động'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loa */}
            {speakers.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">🔊 Loa ({speakers.length})</h3>
                <div className="space-y-3">
                  {speakers.map((s) => (
                    <div key={s.id} className="bg-white rounded p-3 border border-orange-300">
                      <div className="font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <div>Loại: {s.type}</div>
                        <div>Vị trí: ({s.position[0].toFixed(2)}, {s.position[1].toFixed(2)}, {s.position[2].toFixed(2)})m</div>
                        <div>Xoay: ({(s.rotation[0] * 180 / Math.PI).toFixed(1)}°, {(s.rotation[1] * 180 / Math.PI).toFixed(1)}°, {(s.rotation[2] * 180 / Math.PI).toFixed(1)}°)</div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded border border-gray-300" style={{ backgroundColor: s.color }}></div>
                          <span>Màu: {s.color}</span>
                        </div>
                        <div>Công suất: {s.power}W</div>
                        <div>Chất lượng: {s.quality}</div>
                        <div>Đang phát: <span className={s.isPlaying ? 'text-green-600 font-medium' : 'text-gray-500'}>{s.isPlaying ? 'Có' : 'Không'}</span></div>
                        <div>Âm lượng: {s.volume !== undefined ? `${Math.round((s.volume ?? 0) * 100)}%` : '100%'}</div>
                        {s.customSpecs && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="font-medium text-gray-700 mb-1">Thông số tùy chỉnh:</div>
                            <div className="pl-2 space-y-0.5">
                              <div>Tần số: {s.customSpecs.frequencyLow}Hz - {s.customSpecs.frequencyHigh}Hz</div>
                              <div>Công suất: {s.customSpecs.power}W</div>
                              <div>Trở kháng: {s.customSpecs.impedance}Ω</div>
                              <div>Độ nhạy: {s.customSpecs.sensitivity}dB</div>
                              <div>Bass: {s.customSpecs.bassBoost > 0 ? '+' : ''}{s.customSpecs.bassBoost}dB</div>
                              <div>Mid: {s.customSpecs.midBoost > 0 ? '+' : ''}{s.customSpecs.midBoost}dB</div>
                              <div>Treble: {s.customSpecs.trebleBoost > 0 ? '+' : ''}{s.customSpecs.trebleBoost}dB</div>
                              <div>THD: {s.customSpecs.thd}%</div>
                              <div>Crossover: {s.customSpecs.crossoverFrequency}Hz</div>
                            </div>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="font-medium text-gray-700 mb-1">Thông số âm thanh:</div>
                          <div className="pl-2 space-y-0.5">
                            <div>Ref Distance: {s.refDistance ? `${s.refDistance}m` : '1.2m (mặc định)'}</div>
                            <div>Max Distance: {s.maxDistance ? `${s.maxDistance}m` : '12m (mặc định)'}</div>
                            <div>Rolloff Factor: {s.rolloffFactor ?? 1}</div>
                            <div>Cone Inner: {s.coneInnerAngle ? `${s.coneInnerAngle}°` : '60° (mặc định)'}</div>
                            <div>Cone Outer: {s.coneOuterAngle ? `${s.coneOuterAngle}°` : '120° (mặc định)'}</div>
                            <div>Cone Outer Gain: {s.coneOuterGain ? `${Math.round((s.coneOuterGain ?? 0) * 100)}%` : '30% (mặc định)'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vật thể test */}
            {testObjectPosition && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">🎯 Vật thể test</h3>
                <div className="bg-white rounded p-3 border border-yellow-300">
                  <div className="text-sm text-gray-800">
                    <div>Vị trí: ({testObjectPosition[0].toFixed(2)}, {testObjectPosition[1].toFixed(2)}, {testObjectPosition[2].toFixed(2)})m</div>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Data */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📄 Dữ liệu JSON</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {specsJson}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Tổng: {furniture.length} nội thất • {listeners.length} người nghe • {speakers.length} loa
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyToClipboard}
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
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSpecsModal;

