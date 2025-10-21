import React from 'react';

interface ProductListSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

const ProductListSkeleton: React.FC<ProductListSkeletonProps> = ({
  count = 12,
  viewMode = 'grid',
}) => {
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Image */}
      <div className="aspect-square bg-gray-200"></div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Brand */}
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        
        {/* Name */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        
        {/* Price */}
        <div className="space-y-1">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );

  const SkeletonListCard = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Brand */}
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          
          {/* Name */}
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Rating and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </div>
          
          {/* Button */}
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'
    }`}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {viewMode === 'grid' ? <SkeletonCard /> : <SkeletonListCard />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProductListSkeleton;
