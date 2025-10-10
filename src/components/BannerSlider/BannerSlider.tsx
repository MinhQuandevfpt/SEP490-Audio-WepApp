import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { banners } from '../../data/banners';

const BannerSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Get current banner for single banner layout
  const currentBanner = banners[currentSlide];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 relative">
      {/* Single Banner Container */}
      <div className="relative">
        <div className="relative bg-gray-50 rounded-lg overflow-hidden group">
          <div className="relative h-80">
            <a href={currentBanner.link} className="block h-full">
              <img 
                src={currentBanner.image} 
                alt={currentBanner.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback */}
              <div 
                className="absolute inset-0 items-center justify-center hidden"
                style={{ backgroundColor: currentBanner.backgroundColor }}
              >
                <div className="text-center text-white p-8">
                  <h3 className="text-3xl font-bold mb-2">{currentBanner.title}</h3>
                  <p className="text-lg opacity-90">{currentBanner.subtitle}</p>
                  <button className="mt-4 bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
                    Xem ngay
                  </button>
                </div>
              </div>
            </a>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-20"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-20"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Dots Indicator - Outside banner, centered */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-blue-500 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;