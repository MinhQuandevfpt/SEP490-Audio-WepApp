import React from 'react';

interface ImageGalleryProps {
  images: string[];
}

const fallbackSvg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="#9ca3af">No Image</text></svg>`
  );

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const validImages = images && images.length > 0 ? images : [fallbackSvg];
  const [active, setActive] = React.useState(0);

  // keyboard navigation
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setActive((p) => Math.min(validImages.length - 1, p + 1));
    if (e.key === 'ArrowLeft') setActive((p) => Math.max(0, p - 1));
  };

  return (
    <div onKeyDown={onKey} tabIndex={0} className="outline-none">
      <div className="aspect-square w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="w-full h-full group relative">
          <img
            src={validImages[active]}
            alt={`Hình ${active + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(ev) => {
              const target = ev.currentTarget as HTMLImageElement;
              target.src = fallbackSvg;
            }}
          />
          {/* Prev/Next */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={() => setActive((p) => (p - 1 + validImages.length) % validImages.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                onClick={() => setActive((p) => (p + 1) % validImages.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                aria-label="Ảnh sau"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
      {validImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {validImages.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              aria-label={`Ảnh ${idx + 1}`}
              className={`aspect-square rounded-xl border overflow-hidden focus:ring-2 focus:ring-orange-500 ${
                active === idx ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
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
  );
};

export default ImageGallery;


