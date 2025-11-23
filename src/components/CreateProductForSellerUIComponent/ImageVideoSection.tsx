import React, { useState } from 'react';
import { Upload, X, Video, Loader2 } from 'lucide-react';
import SectionCard from './SectionCard';

type ProductImage = { id: string; url: string; file?: File };

interface ImageVideoSectionProps {
  images: ProductImage[];
  videoUrl: string;
  touchedImages?: boolean;
  onImagesChange: (images: ProductImage[]) => void;
  onAddImageFiles: (files: FileList) => void;
  onRemoveImage: (id: string) => void;
  onImagesTouched?: () => void;
  onVideoFileUpload?: (file: File) => Promise<void>;
  onRemoveVideo?: () => void;
}

const ImageVideoSection: React.FC<ImageVideoSectionProps> = ({
  images,
  videoUrl,
  touchedImages = false,
  onImagesChange,
  onAddImageFiles,
  onRemoveImage,
  onImagesTouched,
  onVideoFileUpload,
  onRemoveVideo,
}) => {
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  // Video upload handler - Upload directly
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/mp4')) {
      alert('Chỉ hỗ trợ định dạng video MP4');
      e.target.value = '';
      return;
    }

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      alert('Dung lượng video không được vượt quá 30MB');
      e.target.value = '';
      return;
    }

    // Upload video directly
    if (onVideoFileUpload) {
      setUploadingVideo(true);
      try {
        await onVideoFileUpload(file);
      } catch (error) {
        console.error('Upload video error:', error);
      } finally {
        setUploadingVideo(false);
      }
    }
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
                Định dạng: JPG, PNG, WEBP, GIF (tối đa 10MB/ảnh)
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
            <ul className="list-disc list-inside">
              <li>Kéo thả ảnh để sắp xếp thứ tự. Ảnh đầu tiên sẽ là ảnh đại diện.</li> 
              <li>Việc sử dụng ảnh đẹp sẽ thu hút thêm lượt truy cập vào sản phẩm của bạn</li>
            </ul>
          </p>
        </div>

        {/* Video Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            <Video className="inline h-4 w-4 mr-1" />
            Video sản phẩm
          </label>
          
          {!videoUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors bg-gray-50">
              <input
                type="file"
                accept="video/mp4"
                onChange={handleVideoFileChange}
                className="hidden"
                id="video-upload"
                disabled={uploadingVideo}
              />
              <label htmlFor="video-upload" className={`cursor-pointer ${uploadingVideo ? 'opacity-50' : ''}`}>
                {uploadingVideo ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 text-orange-500 mb-3 animate-spin" />
                    <p className="text-sm text-gray-700 font-medium">Đang tải video...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-700 font-medium mb-1">Tải video lên</p>
                    <p className="text-xs text-gray-500">
                      Định dạng MP4 (tối đa 30MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="relative border-2 border-gray-300 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Video className="h-10 w-10 text-orange-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900">Video sản phẩm</p>
                </div>
                <button
                  type="button"
                  onClick={onRemoveVideo}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Video preview */}
              <div className="mt-3">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full rounded-lg max-h-60"
                >
                  Trình duyệt không hỗ trợ video
                </video>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default ImageVideoSection;
