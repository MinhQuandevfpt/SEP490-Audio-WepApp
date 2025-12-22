import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, Upload, X, Minimize2, Maximize2 } from 'lucide-react';
import AudioService from '../../services/audio/AudioService';
import type { SpeakerModel } from '../../services/audio/AudioService';

interface AudioPlayerProps {
  speakerModel: SpeakerModel | null;
  audioUrl: string;
  volume?: number; // Volume từ parent (0-1)
  pan?: number; // Panning từ parent (-1 = left, 0 = center, +1 = right)
  onClose?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void; // Callback khi play/pause
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ speakerModel, audioUrl, volume = 1.0, pan = 0, onClose, onPlayingChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(0));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioServiceRef = useRef<AudioService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup uploaded file URL khi component unmount
  useEffect(() => {
    return () => {
      if (uploadedFileUrl && uploadedFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedFileUrl);
      }
    };
  }, [uploadedFileUrl]);

  // Khởi tạo AudioService - CHỈ MỘT LẦN khi mount hoặc audioUrl thay đổi
  useEffect(() => {
    // Sử dụng uploadedFileUrl nếu có, nếu không thì dùng audioUrl mặc định
    const activeAudioUrl = uploadedFileUrl || audioUrl;
    if (!activeAudioUrl) return;

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
    const audioService = new AudioService(activeAudioUrl);
    audioServiceRef.current = audioService;

    const initializeAudio = async () => {
      try {
        await audioService.initialize();
        if (speakerModel) {
        audioService.selectSpeakerModel(speakerModel);
        }
        audioService.setVolume(volume);
        audioService.setPan(pan);
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
  }, [audioUrl, uploadedFileUrl]); // Phụ thuộc vào audioUrl và uploadedFileUrl

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

  // Update panning khi prop pan thay đổi
  useEffect(() => {
    if (audioServiceRef.current && isInitializedRef.current) {
      audioServiceRef.current.setPan(pan);
    }
  }, [pan]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith('audio/')) {
      alert('Vui lòng chọn file âm thanh (MP3, WAV, OGG, v.v.)');
      return;
    }

    setIsUploading(true);
    try {
      // Tạo object URL từ file
      const objectUrl = URL.createObjectURL(file);
      
      // Revoke URL cũ nếu có
      if (uploadedFileUrl && uploadedFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedFileUrl);
      }

      setUploadedFile(file);
      setUploadedFileUrl(objectUrl);
      
      // Dừng phát nhạc hiện tại nếu đang phát
      if (isPlaying && audioServiceRef.current) {
        audioServiceRef.current.pause();
        setIsPlaying(false);
        if (onPlayingChange) {
          onPlayingChange(false);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Lỗi khi upload file. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveUploadedFile = () => {
    // Dừng phát nhạc nếu đang phát
    if (isPlaying && audioServiceRef.current) {
      audioServiceRef.current.pause();
      setIsPlaying(false);
      if (onPlayingChange) {
        onPlayingChange(false);
      }
    }

    // Revoke object URL
    if (uploadedFileUrl && uploadedFileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedFileUrl);
    }

    setUploadedFile(null);
    setUploadedFileUrl(null);
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
            {!isMinimized && (
              <>
                <p className="text-xs text-gray-500">{speakerModel.brand} • {speakerModel.description}</p>
                {speakerModel.eqPreset && (
                  <p className="text-xs text-orange-600 mt-1">
                    EQ: {speakerModel.eqPreset.name}
                  </p>
                )}
                {uploadedFile && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    File: {uploadedFile.name}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Minimize/Maximize Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!isMinimized ? (
          <>
            {/* File Upload Section */}
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Upload file MP3 của bạn
                  </label>
                  <p className="text-xs text-gray-500">
                    {uploadedFile ? `Đang sử dụng: ${uploadedFile.name}` : 'Chọn file để test với âm thanh của bạn'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="audio-file-upload"
                  />
                  <label
                    htmlFor="audio-file-upload"
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                      isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    {isUploading ? 'Đang tải...' : uploadedFile ? 'Thay đổi' : 'Chọn file'}
                  </label>
                  {uploadedFile && (
                    <button
                      onClick={handleRemoveUploadedFile}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xóa file đã upload"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
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
          </>
        ) : (
          /* Minimized View - Chỉ hiển thị controls cơ bản */
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            
            {/* Progress Bar - Compact */}
            <div className="flex-1">
              <div
                className="w-full h-1.5 bg-gray-200 rounded-full cursor-pointer relative"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-orange-600 rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;

