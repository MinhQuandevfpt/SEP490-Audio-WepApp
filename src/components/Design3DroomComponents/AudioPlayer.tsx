import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import AudioService from '../../services/audio/AudioService';
import type { SpeakerModel } from '../../services/audio/AudioService';

interface AudioPlayerProps {
  speakerModel: SpeakerModel | null;
  audioUrl: string;
  volume?: number; // Volume từ parent (0-1)
  onClose?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void; // Callback khi play/pause
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ speakerModel, audioUrl, volume = 1.0, onClose, onPlayingChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(0));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioServiceRef = useRef<AudioService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Khởi tạo AudioService - CHỈ MỘT LẦN khi mount hoặc audioUrl thay đổi
  useEffect(() => {
    if (!audioUrl) return;

    // Dispose service cũ nếu có
    if (audioServiceRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioServiceRef.current.dispose();
      audioServiceRef.current = null;
      isInitializedRef.current = false;
      setIsPlaying(false);
    }

    // Tạo và initialize service mới
    const audioService = new AudioService(audioUrl);
    audioServiceRef.current = audioService;

    const initializeAudio = async () => {
      try {
        await audioService.initialize();
        if (speakerModel) {
          audioService.selectSpeakerModel(speakerModel);
        }
        audioService.setVolume(volume);
        // Lấy duration sau khi initialize
        const audioDuration = audioService.getDuration();
        setDuration(audioDuration);
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup khi component unmount hoặc audioUrl thay đổi
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioServiceRef.current) {
        audioServiceRef.current.dispose();
        audioServiceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [audioUrl]); // Chỉ phụ thuộc vào audioUrl

  // Update EQ settings khi speakerModel thay đổi - KHÔNG PAUSE NHẠC
  // Chỉ trigger khi EQ preset thực sự thay đổi, không phải khi object reference thay đổi
  useEffect(() => {
    if (!audioServiceRef.current || !speakerModel || !isInitializedRef.current) return;

    // Update EQ settings mà không re-initialize
    // selectSpeakerModel sẽ tự kiểm tra xem EQ có thay đổi không
    try {
      audioServiceRef.current.selectSpeakerModel(speakerModel);
      // Sau khi selectSpeakerModel, đảm bảo volume được giữ nguyên
      audioServiceRef.current.setVolume(volume);
    } catch (error) {
      console.error('Error updating speaker model:', error);
    }
  }, [speakerModel?.eqPreset?.bass, speakerModel?.eqPreset?.mid, speakerModel?.eqPreset?.treble, speakerModel?.eqPreset?.gain, volume]); // Chỉ phụ thuộc vào EQ preset values và volume

  // Update volume khi prop volume thay đổi
  useEffect(() => {
    if (audioServiceRef.current && isInitializedRef.current) {
      audioServiceRef.current.setVolume(volume);
    }
  }, [volume]);

  // Waveform animation và progress update
  const updateWaveform = useCallback(() => {
    if (audioServiceRef.current && isPlaying) {
      const data = audioServiceRef.current.getWaveformData();
      setWaveformData(data);
      
      // Cập nhật currentTime nếu không đang seek
      if (!isSeeking) {
        const time = audioServiceRef.current.getCurrentTime();
        setCurrentTime(time);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [isPlaying, isSeeking]);

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

  // Update duration khi audio buffer load xong
  useEffect(() => {
    if (audioServiceRef.current && isInitializedRef.current) {
      const audioDuration = audioServiceRef.current.getDuration();
      if (audioDuration > 0) {
        setDuration(audioDuration);
      }
    }
  }, [audioServiceRef.current, isInitializedRef.current]);

  const handlePlayPause = async () => {
    if (!audioServiceRef.current) return;

    if (isPlaying) {
      audioServiceRef.current.pause();
      setIsPlaying(false);
      if (onPlayingChange) {
        onPlayingChange(false);
      }
    } else {
      await audioServiceRef.current.play();
      setIsPlaying(true);
      if (onPlayingChange) {
        onPlayingChange(true);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioServiceRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    setIsSeeking(true);
    setCurrentTime(newTime);
    audioServiceRef.current.seek(newTime);
    
    // Reset seeking flag sau một chút
    setTimeout(() => setIsSeeking(false), 100);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        {/* Progress Bar */}
        <div className="mb-3">
          <div
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-orange-600 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
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

