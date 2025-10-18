import React from 'react';
import SectionCard from './SectionCard';

export interface ProductImage { id: string; url: string; file?: File };

interface MediaUploaderProps {
  images: ProductImage[];
  onFiles: (files: FileList) => void;
  onDropFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ images, onFiles, onDropFiles, onRemove }) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(e.target.files);
  };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => { preventDefault(e); if (e.dataTransfer.files) onDropFiles(e.dataTransfer.files); };

  return (
    <SectionCard title="Hình ảnh" description="Kéo thả hoặc tải lên hình ảnh sản phẩm">
      <div>
        <div onDrop={onDrop} onDragEnter={preventDefault} onDragOver={preventDefault} className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
          <p className="text-sm text-gray-600">Kéo & thả ảnh vào đây hoặc</p>
          <div className="mt-2">
            <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">Chọn ảnh
              <input type="file" accept="image/*" multiple onChange={handleInput} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG • Tối đa 10 ảnh</p>
        </div>
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


