import React from 'react';
import { X, ChevronLeft, ChevronRight, Video } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  videoUrl?: string | null;
  mainImageOverride?: string; // Override main image display (for variant hover/click)
}

const fallbackSvg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="#9ca3af">No Image</text></svg>`
  );

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, videoUrl, mainImageOverride }) => {
  const validImages = images && images.length > 0 ? images : [fallbackSvg];
  
  // Create media items array: images + video (if exists)
  const mediaItems = React.useMemo(() => {
    const items = [...validImages];
    if (videoUrl) {
      items.push(videoUrl); // Add video URL to the end
    }
    return items;
  }, [validImages, videoUrl]);
  
  const [active, setActive] = React.useState(0);
  const [showModal, setShowModal] = React.useState(false);
  const [thumbStartIndex, setThumbStartIndex] = React.useState(0);
  const maxVisibleThumbs = 5;
  
  // Check if current item is video
  const isVideo = (index: number) => {
    return videoUrl && index === validImages.length;
  };

  // keyboard navigation
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setActive((p) => Math.min(mediaItems.length - 1, p + 1));
    if (e.key === 'ArrowLeft') setActive((p) => Math.max(0, p - 1));
    if (e.key === 'Escape') setShowModal(false);
  };

  const handlePrev = () => {
    setActive((p) => (p - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleNext = () => {
    setActive((p) => (p + 1) % mediaItems.length);
  };

  const handleThumbPrev = () => {
    setThumbStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleThumbNext = () => {
    setThumbStartIndex((prev) => Math.min(mediaItems.length - maxVisibleThumbs, prev + 1));
  };

  const visibleThumbs = mediaItems.slice(thumbStartIndex, thumbStartIndex + maxVisibleThumbs);
  const canScrollLeft = thumbStartIndex > 0;
  const canScrollRight = thumbStartIndex + maxVisibleThumbs < mediaItems.length;

  // Display media: Use override if provided, otherwise use selected from thumbnails
  const displayMedia = mainImageOverride || mediaItems[active];
  const isActiveVideo = isVideo(active);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  return (
    <>
      <div onKeyDown={onKey} tabIndex={0} className="outline-none">
        <div 
          className="aspect-square w-full bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div className="w-full h-full group relative">
            {!mainImageOverride && isActiveVideo ? (
              <video 
                src={displayMedia}
                controls 
                className="w-full h-full object-cover"
                onClick={(e) => e.stopPropagation()}
              >
                Trình duyệt không hỗ trợ video
              </video>
            ) : (
              <img
                src={displayMedia}
                alt={`Hình ${active + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(ev) => {
                  const target = ev.currentTarget as HTMLImageElement;
                  target.src = fallbackSvg;
                }}
              />
            )}
            {/* Zoom indicator */}
            {!isActiveVideo && (
              <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Click để phóng to
              </div>
            )}
            {/* Prev/Next */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                  aria-label="Ảnh trước"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                  aria-label="Ảnh sau"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
        {/* Show thumbnails if more than 1 image OR if there's a video */}
        {(mediaItems.length > 1 || (validImages.length === 1 && videoUrl)) && (
          <div className="mt-3 relative">
            {/* Previous button */}
            {canScrollLeft && (
              <button
                onClick={handleThumbPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            {/* Thumbnails */}
            <div className="grid grid-cols-5 gap-2">
              {visibleThumbs.map((src, idx) => {
                const actualIndex = thumbStartIndex + idx;
                const isThumbVideo = isVideo(actualIndex);
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setActive(actualIndex)}
                    aria-label={isThumbVideo ? 'Video' : `Ảnh ${actualIndex + 1}`}
                    className={`aspect-square rounded-xl border overflow-hidden focus:ring-2 focus:ring-orange-500 transition-all relative ${
                      active === actualIndex ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isThumbVideo ? (
                      <>
                        <video
                          src={src}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={src}
                        alt={`Thumb ${actualIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = fallbackSvg)}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {canScrollRight && (
              <button
                onClick={handleThumbNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal/Popup for full-size images */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Đóng"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm z-10">
            {active + 1} / {validImages.length}
          </div>

          {/* Main image */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validImages[active]}
              alt={`Hình ${active + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(ev) => {
                const target = ev.currentTarget as HTMLImageElement;
                target.src = fallbackSvg;
              }}
            />

            {/* Navigation buttons */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                  aria-label="Ảnh sau"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail navigation */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-2xl overflow-x-auto px-4 pb-2">
              {validImages.map((src, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(idx);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                    active === idx ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={src}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = fallbackSvg)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;


