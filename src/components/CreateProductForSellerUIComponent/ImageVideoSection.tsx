import React from 'react';
import { Upload, X, Video } from 'lucide-react';
import SectionCard from './SectionCard';

type ProductImage = { id: string; url: string; file?: File };

interface ImageVideoSectionProps {
  images: ProductImage[];
  videoUrl: string;
  touchedImages?: boolean;
  onImagesChange: (images: ProductImage[]) => void;
  onVideoUrlChange: (url: string) => void;
  onAddImageFiles: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onImagesTouched?: () => void;
}

const ImageVideoSection: React.FC<ImageVideoSectionProps> = ({
  images,
  videoUrl,
  touchedImages = false,
  onImagesChange,
  onVideoUrlChange,
  onAddImageFiles,
  onRemoveImage,
  onImagesTouched,
}) => {
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddImageFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark as touched when user interacts with file input
    onImagesTouched?.();
    
    if (e.target.files && e.target.files.length > 0) {
      onAddImageFiles(e.target.files);
    }
    // Reset input value để có thể chọn lại cùng file nếu cần
    e.target.value = '';
  };

  // Reorder images via drag and drop
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    onImagesChange(newImages);
  };

  return (
    <SectionCard title="Thông tin cơ bản" description="Tải ảnh hoặc nhập link, video cho sản phẩm">
      <div className="space-y-6">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            <span className="text-red-500">* </span>Hình ảnh sản phẩm
          </label>
          
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors cursor-pointer bg-gray-50"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-xs text-gray-500">
                Hỗ trợ: JPG, PNG, WEBP, GIF (tối đa 10MB/ảnh)
              </p>
              <p className="text-xs text-orange-600 font-medium mt-1">
                Upload tối đa 9 ảnh sản phẩm
              </p>
            </label>
          </div>

          {/* Error message when no images and touched */}
          {touchedImages && images.length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              Vui lòng chọn ảnh sản phẩm, sản phẩm này cần ít nhất 1 ảnh đại diện
            </p>
          )}

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={handleImageDragOver}
                  onDrop={(e) => handleImageDrop(e, index)}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-500 transition-colors cursor-move"
                >
                  <img
                    src={img.url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                      Ảnh chính
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            💡 Mẹo: Kéo thả ảnh để sắp xếp thứ tự. Ảnh đầu tiên sẽ là ảnh đại diện.
          </p>
        </div>

        {/* Video URL Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            <Video className="inline h-4 w-4 mr-1" />
            Video sản phẩm (URL)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=... hoặc URL video khác"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-orange-600 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            Nhập link YouTube, Vimeo hoặc URL video trực tiếp từ CDN
          </p>
        </div>
      </div>
    </SectionCard>
  );
};

export default ImageVideoSection;
