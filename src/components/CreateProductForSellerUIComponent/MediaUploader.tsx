import React, { useState } from 'react';
import SectionCard from './SectionCard';

export interface ProductImage { id: string; url: string; file?: File };

interface MediaUploaderProps {
  images: ProductImage[];
  onFiles: (files: FileList) => void;
  onDropFiles: (files: FileList) => void;
  onAddUrl: (url: string) => void;
  onRemove: (id: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ images, onFiles, onDropFiles, onAddUrl, onRemove }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(e.target.files);
  };

  const handleAddUrl = () => {
    if (imageUrl.trim()) {
      onAddUrl(imageUrl.trim());
      setImageUrl('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => { preventDefault(e); if (e.dataTransfer.files) onDropFiles(e.dataTransfer.files); };

  return (
    <SectionCard title="Hình ảnh" description="Tải lên hình ảnh từ máy tính hoặc thêm link ảnh từ mạng">
      <div>
        {/* Mode Toggle */}
        <div className="flex mb-4">
          <button
            type="button"
            onClick={() => setIsUrlMode(false)}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              !isUrlMode 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            📁 Từ máy tính
          </button>
          <button
            type="button"
            onClick={() => setIsUrlMode(true)}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              isUrlMode 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🌐 Từ link
          </button>
        </div>

        {!isUrlMode ? (
          /* File Upload Mode */
          <div onDrop={onDrop} onDragEnter={preventDefault} onDragOver={preventDefault} className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
            <p className="text-sm text-gray-600">Kéo & thả ảnh vào đây hoặc</p>
            <div className="mt-2">
              <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">Chọn ảnh
                <input type="file" accept="image/*" multiple onChange={handleInput} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG • Tối đa 10 ảnh</p>
          </div>
        ) : (
          /* URL Input Mode */
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!imageUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Thêm
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Nhập link ảnh từ mạng (JPG, PNG, JPEG, WebP)
            </p>
          </div>
        )}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">{images.map(img => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="preview" className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm" />
              <button type="button" onClick={() => onRemove(img.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100" aria-label="remove">×</button>
            </div>
          ))}</div>
        )}
      </div>
    </SectionCard>
  );
};

export default MediaUploader;


