import React, { useState } from 'react';
import { Move, Headphones } from 'lucide-react';
import type { Speaker, CustomSpeakerSpecs } from './index';
import AudioPlayer from './AudioPlayer';
import type { EQPreset } from '../../services/audio/AudioService';

interface SpeakerDesignSectionProps {
  // Props không còn được sử dụng nhưng vẫn cần để giữ interface tương thích
  speakers: Speaker[];
  onAddSpeaker: (speaker: Omit<Speaker, 'id'>) => void;
  onRemoveSpeaker: (id: string) => void;
  onUpdateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  // Test mode props
  onTestSpeaker?: (specs: CustomSpeakerSpecs | null) => void;
  onTestObjectPositionChange?: (position: [number, number, number] | null) => void;
  onTestingIn3DChange?: (isTesting: boolean) => void;
}


// Default custom specs
const DEFAULT_CUSTOM_SPECS: CustomSpeakerSpecs = {
  frequencyLow: 50,
  frequencyHigh: 20000,
  power: 100,
  impedance: 8,
  sensitivity: 90,
  bassBoost: 0,
  midBoost: 0,
  trebleBoost: 0,
  thd: 0.5,
  crossoverFrequency: 2000
};

// Convert custom specs to EQ Preset for AudioService
const convertSpecsToEQPreset = (specs: CustomSpeakerSpecs): EQPreset => {
  return {
    name: 'Custom',
    bass: specs.bassBoost,
    mid: specs.midBoost,
    treble: specs.trebleBoost,
    gain: (specs.sensitivity - 90) / 10 // Normalize sensitivity to gain
  };
};

// Create a mock SpeakerModel from custom specs for AudioPlayer
const createSpeakerModelFromSpecs = (specs: CustomSpeakerSpecs, name: string) => {
  return {
    id: `custom_${Date.now()}`,
    name: name,
    brand: 'Custom',
    type: 'desk_pair' as const,
    description: `Custom speaker: ${specs.frequencyLow}Hz-${specs.frequencyHigh}Hz, ${specs.power}W, ${specs.impedance}Ω`,
    eqPreset: convertSpecsToEQPreset(specs),
    specs: {
      frequencyResponse: `${specs.frequencyLow}Hz - ${specs.frequencyHigh}Hz`,
      power: `${specs.power}W`,
      impedance: `${specs.impedance}Ω`,
      sensitivity: `${specs.sensitivity}dB`
    }
  };
};

const SpeakerDesignSection: React.FC<SpeakerDesignSectionProps> = ({
  speakers: _speakers,
  onAddSpeaker: _onAddSpeaker,
  onRemoveSpeaker: _onRemoveSpeaker,
  onUpdateSpeaker: _onUpdateSpeaker,
  onTestSpeaker,
  onTestObjectPositionChange,
  onTestingIn3DChange
}) => {
  const [customSpecs, setCustomSpecs] = useState<CustomSpeakerSpecs>(DEFAULT_CUSTOM_SPECS);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [isTestingIn3D, setIsTestingIn3D] = useState<boolean>(false);
  const [testObjectPosition, setTestObjectPosition] = useState<[number, number, number]>([0, 0.5, 0]);

  const handleSpecChange = (key: keyof CustomSpeakerSpecs, value: number) => {
    setCustomSpecs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTestAudio = () => {
    setIsTestingAudio(true);
  };

  const handleTestIn3D = () => {
    setIsTestingIn3D(true);
    if (onTestSpeaker) {
      onTestSpeaker(customSpecs);
    }
    if (onTestObjectPositionChange) {
      onTestObjectPositionChange(testObjectPosition);
    }
    if (onTestingIn3DChange) {
      onTestingIn3DChange(true);
    }
  };

  const handleStopTest = () => {
    setIsTestingIn3D(false);
    if (onTestSpeaker) {
      onTestSpeaker(null);
    }
    if (onTestObjectPositionChange) {
      onTestObjectPositionChange(null);
    }
    if (onTestingIn3DChange) {
      onTestingIn3DChange(false);
    }
  };

  const handleMoveTestObject = (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
    const newPosition: [number, number, number] = [...testObjectPosition];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] += direction * 0.5; // Move 0.5m per step
    setTestObjectPosition(newPosition);
    if (onTestObjectPositionChange) {
      onTestObjectPositionChange(newPosition);
    }
  };

  // Audio URL - sử dụng SoundCloud embed hoặc direct URL
  // Note: SoundCloud không cho phép direct download, cần dùng proxy hoặc upload file lên CDN
  const AUDIO_URL = './public/See You Again Remix.mp3'; // Placeholder - thay bằng URL thực tế

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔊</span>
          <h3 className="text-lg font-semibold text-gray-800">Thiết kế loa</h3>
        </div>
      </div>

      {/* Customize Speaker Specs */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700">Tùy chỉnh thông số kỹ thuật loa</h4>
          
          {/* Frequency Response */}
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <label className="text-xs font-medium text-gray-700">Dải tần số (Frequency Response)</label>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tần số thấp (Bass): {customSpecs.frequencyLow} Hz</span>
                  <span className="text-gray-400">20-200 Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={customSpecs.frequencyLow}
                  onChange={(e) => handleSpecChange('frequencyLow', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tần số cao (Treble): {customSpecs.frequencyHigh} Hz</span>
                  <span className="text-gray-400">2000-50000 Hz</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={customSpecs.frequencyHigh}
                  onChange={(e) => handleSpecChange('frequencyHigh', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Power */}
          <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Công suất (Power)</label>
              <span className="text-xs font-semibold text-green-700">{customSpecs.power}W</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={customSpecs.power}
              onChange={(e) => handleSpecChange('power', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <p className="text-xs text-gray-500">Công suất cao hơn = âm thanh lớn hơn, nhưng cần ampli mạnh hơn</p>
          </div>

          {/* Impedance */}
          <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Trở kháng (Impedance)</label>
              <span className="text-xs font-semibold text-purple-700">{customSpecs.impedance}Ω</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[4, 6, 8, 16].map(ohm => (
                <button
                  key={ohm}
                  onClick={() => handleSpecChange('impedance', ohm)}
                  className={`px-2 py-1 text-xs rounded border-2 transition-all ${
                    customSpecs.impedance === ohm
                      ? 'border-purple-600 bg-purple-100 text-purple-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {ohm}Ω
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Trở kháng thấp = cần ampli mạnh hơn, nhưng hiệu suất tốt hơn</p>
          </div>

          {/* Sensitivity */}
          <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Độ nhạy (Sensitivity)</label>
              <span className="text-xs font-semibold text-yellow-700">{customSpecs.sensitivity} dB/W/m</span>
            </div>
            <input
              type="range"
              min="80"
              max="120"
              step="1"
              value={customSpecs.sensitivity}
              onChange={(e) => handleSpecChange('sensitivity', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
            />
            <p className="text-xs text-gray-500">Độ nhạy cao = âm thanh lớn hơn với cùng công suất</p>
          </div>

          {/* EQ Adjustments */}
          <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <label className="text-xs font-medium text-gray-700">Điều chỉnh EQ (dB)</label>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Bass: {customSpecs.bassBoost > 0 ? '+' : ''}{customSpecs.bassBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={customSpecs.bassBoost}
                  onChange={(e) => handleSpecChange('bassBoost', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Mid: {customSpecs.midBoost > 0 ? '+' : ''}{customSpecs.midBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={customSpecs.midBoost}
                  onChange={(e) => handleSpecChange('midBoost', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Treble: {customSpecs.trebleBoost > 0 ? '+' : ''}{customSpecs.trebleBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={customSpecs.trebleBoost}
                  onChange={(e) => handleSpecChange('trebleBoost', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
            </div>
          </div>

          {/* THD */}
          <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-gray-700">Độ méo tiếng (THD)</label>
              <span className="text-xs font-semibold text-red-700">{customSpecs.thd}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={customSpecs.thd}
              onChange={(e) => handleSpecChange('thd', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <p className="text-xs text-gray-500">THD thấp = âm thanh trung thực hơn, ít méo tiếng</p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            {!isTestingIn3D ? (
              <button
                onClick={handleTestIn3D}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <Move className="w-4 h-4" />
                <span>Xem 3D và di chuyển vật thể</span>
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Điều khiển vật thể test</span>
                  <button
                    onClick={handleStopTest}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Dừng
                  </button>
                </div>
                
                {/* Position Display */}
                <div className="text-xs text-gray-600 bg-white p-2 rounded">
                  <div className="font-medium mb-1">Vị trí:</div>
                  <div>X: {testObjectPosition[0].toFixed(1)}m</div>
                  <div>Y: {testObjectPosition[1].toFixed(1)}m</div>
                  <div>Z: {testObjectPosition[2].toFixed(1)}m</div>
                </div>

                {/* Movement Controls */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Di chuyển:</div>
                  
                  {/* X-axis */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-8">X:</span>
                    <button
                      onClick={() => handleMoveTestObject('x', -1)}
                      className="flex-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                    >
                      ← Trái
                    </button>
                    <button
                      onClick={() => handleMoveTestObject('x', 1)}
                      className="flex-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                    >
                      Phải →
                    </button>
                  </div>

                  {/* Y-axis */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-8">Y:</span>
                    <button
                      onClick={() => handleMoveTestObject('y', -1)}
                      className="flex-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs"
                    >
                      ↓ Xuống
                    </button>
                    <button
                      onClick={() => handleMoveTestObject('y', 1)}
                      className="flex-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs"
                    >
                      ↑ Lên
                    </button>
                  </div>

                  {/* Z-axis */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-8">Z:</span>
                    <button
                      onClick={() => handleMoveTestObject('z', -1)}
                      className="flex-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
                    >
                      ← Sau
                    </button>
                    <button
                      onClick={() => handleMoveTestObject('z', 1)}
                      className="flex-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
                    >
                      Trước →
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleTestAudio}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Headphones className="w-4 h-4" />
              <span>Nghe thử âm thanh</span>
            </button>
          </div>
      </div>

      {/* Audio Player - Hiển thị khi test audio với custom specs */}
      {isTestingAudio && (
        <AudioPlayer
          speakerModel={createSpeakerModelFromSpecs(customSpecs, 'Loa tùy chỉnh')}
          audioUrl={AUDIO_URL}
          onClose={() => setIsTestingAudio(false)}
        />
      )}
    </div>
  );
};

export default SpeakerDesignSection;
