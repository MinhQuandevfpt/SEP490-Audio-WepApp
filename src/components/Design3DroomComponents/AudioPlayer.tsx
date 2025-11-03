import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import AudioService from '../../services/audio/AudioService';
import type { SpeakerModel } from '../../services/audio/AudioService';

interface AudioPlayerProps {
  speakerModel: SpeakerModel | null;
  audioUrl: string;
  onClose?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ speakerModel, audioUrl, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(0));
  const audioServiceRef = useRef<AudioService | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Khởi tạo AudioService
  useEffect(() => {
    if (!speakerModel || !audioUrl) return;

    const audioService = new AudioService(audioUrl);
    audioServiceRef.current = audioService;

    const initializeAudio = async () => {
      try {
        await audioService.initialize();
        audioService.selectSpeakerModel(speakerModel);
        audioService.setVolume(volume);
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioService.dispose();
    };
  }, [speakerModel, audioUrl]);

  // Update volume
  useEffect(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Waveform animation
  const updateWaveform = useCallback(() => {
    if (audioServiceRef.current && isPlaying) {
      const data = audioServiceRef.current.getWaveformData();
      setWaveformData(data);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateWaveform]);

  const handlePlayPause = async () => {
    if (!audioServiceRef.current) return;

    if (isPlaying) {
      audioServiceRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioServiceRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!speakerModel) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-orange-500 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800">{speakerModel.name}</h3>
            <p className="text-xs text-gray-500">{speakerModel.brand} • {speakerModel.description}</p>
            {speakerModel.eqPreset && (
              <p className="text-xs text-orange-600 mt-1">
                EQ: {speakerModel.eqPreset.name}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Waveform Visualization */}
        <div className="mb-3 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
          <svg className="w-full h-full" viewBox="0 0 200 64" preserveAspectRatio="none">
            {waveformData.length > 0 && (
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                points={Array.from(waveformData)
                  .slice(0, 200)
                  .map((value, index) => {
                    const x = (index / 200) * 200;
                    const y = 32 + ((value - 128) / 128) * 30;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
          {!isPlaying && waveformData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
              Nhấn Play để nghe thử
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center w-12 h-12 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Volume Control */}
          <div className="flex-1 flex items-center space-x-2">
            <button
              onClick={handleMute}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <span className="text-xs text-gray-600 w-10 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>

        {/* Specs */}
        {speakerModel.specs && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Tần số:</span>
                <span className="ml-1 font-medium">{speakerModel.specs.frequencyResponse}</span>
              </div>
              <div>
                <span className="text-gray-500">Công suất:</span>
                <span className="ml-1 font-medium">{speakerModel.specs.power}</span>
              </div>
              <div>
                <span className="text-gray-500">Trở kháng:</span>
                <span className="ml-1 font-medium">{speakerModel.specs.impedance}</span>
              </div>
              <div>
                <span className="text-gray-500">Độ nhạy:</span>
                <span className="ml-1 font-medium">{speakerModel.specs.sensitivity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ Chất lượng âm thanh còn phụ thuộc vào thiết bị bạn đang dùng
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

