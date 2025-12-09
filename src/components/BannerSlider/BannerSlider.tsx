import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomerBannerService } from '../../services/customer/CustomerBannerService';
import type { BannerImage } from '../../types/admin';

interface BannerSlide extends BannerImage {
  bannerTitle: string;
  bannerDescription: string;
}

const BannerSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const banners = await CustomerBannerService.getActiveBanners();
        
        // Flatten all banner images into slides
        const slides: BannerSlide[] = [];
        banners.forEach(banner => {
          if (banner.images && banner.images.length > 0) {
            banner.images.forEach(image => {
              slides.push({
                ...image,
                bannerTitle: banner.title,
                bannerDescription: banner.description,
              });
            });
          }
        });

        setBannerSlides(slides);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (bannerSlides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Handle navigation click
  const handleBannerClick = (e: React.MouseEvent, redirectUrl: string) => {
    e.preventDefault();
    
    // Check if it's an external URL
    if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Internal navigation
      window.location.href = redirectUrl;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative bg-gray-100 rounded-lg overflow-hidden animate-pulse">
          <div className="h-80 flex items-center justify-center">
            <div className="text-gray-400">Đang tải banner...</div>
          </div>
        </div>
      </div>
    );
  }

  // No banners available
  if (bannerSlides.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <h3 className="text-3xl font-bold mb-2">Chào mừng đến với Audio Shop</h3>
              <p className="text-lg opacity-90">Khám phá các sản phẩm âm thanh chất lượng cao</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentBannerSlide = bannerSlides[currentSlide];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 relative">
      {/* Single Banner Container */}
      <div className="relative">
        <div className="relative bg-gray-50 rounded-lg overflow-hidden group">
          <div className="relative h-80">
            <a 
              href={currentBannerSlide.redirectUrl} 
              onClick={(e) => handleBannerClick(e, currentBannerSlide.redirectUrl)}
              className="block h-full cursor-pointer"
            >
              <img 
                src={currentBannerSlide.imageUrl} 
                alt={currentBannerSlide.altText}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback */}
              <div 
                className="absolute inset-0 items-center justify-center hidden bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <div className="text-center text-white p-8">
                  <h3 className="text-3xl font-bold mb-2">{currentBannerSlide.bannerTitle}</h3>
                  <p className="text-lg opacity-90">{currentBannerSlide.bannerDescription}</p>
                  <button className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
                    Xem ngay
                  </button>
                </div>
              </div>
            </a>

            {/* Navigation Arrows - Only show if more than 1 slide */}
            {bannerSlides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-20"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-20"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dots Indicator - Outside banner, centered - Only show if more than 1 slide */}
      {bannerSlides.length > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentSlide
                    ? 'bg-blue-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerSlider;