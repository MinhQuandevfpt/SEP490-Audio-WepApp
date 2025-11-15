import React, { useState } from 'react';
import { Plus, Trash2, Move, Play, Pause, Volume2, Headphones, Settings } from 'lucide-react';
import type { Speaker, CustomSpeakerSpecs } from './index';
import AudioPlayer from './AudioPlayer';
import type { EQPreset } from '../../services/audio/AudioService';

interface SpeakerDesignSectionProps {
  speakers: Speaker[];
  onAddSpeaker: (speaker: Omit<Speaker, 'id'>) => void;
  onRemoveSpeaker: (id: string) => void;
  onUpdateSpeaker: (id: string, updates: Partial<Speaker>) => void;
}

const SPEAKER_TYPES = [
  { type: 'floor_single', name: 'Loa đơn đứng', icon: '🔊' },
  { type: 'floor_pair', name: 'Loa đôi đứng', icon: '🔊🔊' },
  { type: 'desk_single', name: 'Loa đơn để bàn', icon: '🔊' },
  { type: 'desk_pair', name: 'Loa đôi để bàn', icon: '🔊🔊' },
  { type: 'wall_single', name: 'Loa đơn treo tường', icon: '🔊' },
  { type: 'wall_pair', name: 'Loa đôi treo tường', icon: '🔊🔊' },
  { type: 'amplifier', name: 'Amply', icon: '🎛️' }
] as const;

const SPEAKER_COLORS = [
  '#000000', '#FFFFFF', '#8B4513', '#D2B48C', '#FFD700',
  '#C0C0C0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
];

const QUALITY_LEVELS = [
  { value: 'basic', label: 'Cơ bản', description: 'Chất lượng âm thanh cơ bản' },
  { value: 'premium', label: 'Cao cấp', description: 'Chất lượng âm thanh cao cấp' },
  { value: 'professional', label: 'Chuyên nghiệp', description: 'Chất lượng âm thanh chuyên nghiệp' }
] as const;

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
  speakers,
  onAddSpeaker,
  onRemoveSpeaker,
  onUpdateSpeaker
}) => {
  const [selectedType, setSelectedType] = useState<string>('floor_single');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedQuality, setSelectedQuality] = useState<string>('premium');
  const [customSpecs, setCustomSpecs] = useState<CustomSpeakerSpecs>(DEFAULT_CUSTOM_SPECS);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'add' | 'customize'>('customize'); // 'add' hoặc 'customize'

  const handleAddSpeaker = () => {
    const newSpeaker: Omit<Speaker, 'id'> = {
      name: `${SPEAKER_TYPES.find(t => t.type === selectedType)?.name} ${speakers.length + 1}`,
      type: selectedType as any,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      color: selectedColor,
      power: customSpecs.power,
      quality: selectedQuality as any,
      isPlaying: false,
      customSpecs: { ...customSpecs }
    };
    onAddSpeaker(newSpeaker);
  };

  const togglePlayback = (speakerId: string, isPlaying: boolean) => {
    onUpdateSpeaker(speakerId, { isPlaying: !isPlaying });
  };

  const handleSpecChange = (key: keyof CustomSpeakerSpecs, value: number) => {
    setCustomSpecs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTestAudio = () => {
    setIsTestingAudio(true);
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
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('customize')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'customize'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-3 h-3 inline mr-1" />
            Tùy chỉnh
          </button>
          <button
            onClick={() => setViewMode('add')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'add'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Thêm loa
          </button>
        </div>
      </div>

      {/* Customize Speaker Specs - View Mode */}
      {viewMode === 'customize' && (
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

          {/* Test Audio Button */}
          <button
            onClick={handleTestAudio}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            <Headphones className="w-4 h-4" />
            <span>Nghe thử với thông số này</span>
          </button>
        </div>
      )}

      {/* Add Speaker - View Mode */}
      {viewMode === 'add' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Thêm loa</h4>
        
        {/* Speaker Type */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Loại loa</label>
          <div className="grid grid-cols-2 gap-2">
            {SPEAKER_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={`p-2 border-2 rounded-lg transition-all text-left ${
                  selectedType === type.type
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-xs font-medium">{type.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Speaker Color */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Màu sắc</label>
          <div className="grid grid-cols-5 gap-2">
            {SPEAKER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded border-2 ${
                  selectedColor === color ? 'border-orange-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Quality Level */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Chất lượng âm thanh</label>
          <div className="space-y-1">
            {QUALITY_LEVELS.map((quality) => (
              <button
                key={quality.value}
                onClick={() => setSelectedQuality(quality.value)}
                className={`w-full p-2 text-left border-2 rounded-lg transition-all ${
                  selectedQuality === quality.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-xs font-medium">{quality.label}</div>
                <div className="text-xs text-gray-500">{quality.description}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddSpeaker}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm loa</span>
        </button>
        </div>
      )}

      {/* Speaker List - Hiển thị cho cả 2 modes */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Loa đã thêm</h4>
        
        {speakers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">🔊</span>
            <p className="text-sm">Chưa có loa nào</p>
            <p className="text-xs">Thêm loa để bắt đầu thiết kế hệ thống âm thanh</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {SPEAKER_TYPES.find(t => t.type === speaker.type)?.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {speaker.name}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: speaker.color }}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => togglePlayback(speaker.id, speaker.isPlaying)}
                      className={`p-1 transition-colors ${
                        speaker.isPlaying 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={speaker.isPlaying ? 'Dừng' : 'Phát'}
                    >
                      {speaker.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onUpdateSpeaker(speaker.id, { 
                        position: [Math.random() * 4 - 2, 0, Math.random() * 3 - 1.5] 
                      })}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Di chuyển"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveSpeaker(speaker.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Vị trí: ({speaker.position[0].toFixed(1)}, {speaker.position[1].toFixed(1)}, {speaker.position[2].toFixed(1)})</span>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1">
                      <Volume2 className="w-3 h-3" />
                      <span>{speaker.power}W</span>
                    </span>
                    <span className="capitalize">{speaker.quality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
