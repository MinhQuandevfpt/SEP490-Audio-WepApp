import React, { useState } from 'react';
import { Plus, Trash2, Move, Play, Pause, Volume2, Headphones } from 'lucide-react';
import type { Speaker } from './index';
import { SPEAKER_MODELS } from '../../services/audio/AudioService';
import type { SpeakerModel } from '../../services/audio/AudioService';
import AudioPlayer from './AudioPlayer';

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

const SpeakerDesignSection: React.FC<SpeakerDesignSectionProps> = ({
  speakers,
  onAddSpeaker,
  onRemoveSpeaker,
  onUpdateSpeaker
}) => {
  const [selectedType, setSelectedType] = useState<string>('floor_single');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedQuality, setSelectedQuality] = useState<string>('premium');
  const [selectedModelForTrial, setSelectedModelForTrial] = useState<SpeakerModel | null>(null);
  const [viewMode, setViewMode] = useState<'add' | 'models'>('models'); // 'add' hoặc 'models'

  const handleAddSpeaker = () => {
    const newSpeaker: Omit<Speaker, 'id'> = {
      name: `${SPEAKER_TYPES.find(t => t.type === selectedType)?.name} ${speakers.length + 1}`,
      type: selectedType as any,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      color: selectedColor,
      power: 100,
      quality: selectedQuality as any,
      isPlaying: false
    };
    onAddSpeaker(newSpeaker);
  };

  const togglePlayback = (speakerId: string, isPlaying: boolean) => {
    onUpdateSpeaker(speakerId, { isPlaying: !isPlaying });
  };

  // Lọc model loa theo loại đã chọn
  const filteredModels = SPEAKER_MODELS.filter(model => {
    if (viewMode === 'models') return true; // Hiển thị tất cả khi xem models
    return model.type === selectedType;
  });

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
            onClick={() => setViewMode('models')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              viewMode === 'models'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Model loa
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

      {/* Speaker Models List - View Mode */}
      {viewMode === 'models' && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700">Chọn model loa để nghe thử</h4>
          
          {filteredModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">🔊</span>
              <p className="text-sm">Không có model loa nào</p>
            </div>
          ) : (
            filteredModels.map((model) => (
              <div
                key={model.id}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-all cursor-pointer"
                onClick={() => {
                  // Khi click vào model, có thể thêm vào phòng hoặc chỉ nghe thử
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="text-sm font-semibold text-gray-800">{model.name}</h5>
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                        {model.brand}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                    
                    {model.specs && (
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                        <div>🎵 {model.specs.frequencyResponse}</div>
                        <div>⚡ {model.specs.power}</div>
                      </div>
                    )}

                    {model.price && (
                      <div className="text-sm font-semibold text-orange-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(model.price)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModelForTrial(model);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Nghe thử</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Thêm loa này vào phòng với thông tin từ model
                      const newSpeaker: Omit<Speaker, 'id'> = {
                        name: model.name,
                        type: model.type,
                        position: [0, 0, 0],
                        rotation: [0, 0, 0],
                        color: '#000000',
                        power: parseInt(model.specs?.power || '100'),
                        quality: model.eqPreset.name.toLowerCase().includes('professional') ? 'professional' :
                                model.eqPreset.name.toLowerCase().includes('premium') ? 'premium' : 'basic',
                        isPlaying: false
                      };
                      onAddSpeaker(newSpeaker);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    title="Thêm vào phòng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
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

      {/* Audio Player - Hiển thị khi chọn model để nghe thử */}
      {selectedModelForTrial && (
        <AudioPlayer
          speakerModel={selectedModelForTrial}
          audioUrl={AUDIO_URL}
          onClose={() => setSelectedModelForTrial(null)}
        />
      )}
    </div>
  );
};

export default SpeakerDesignSection;
