import React from 'react';

interface CategoriesHeaderProps {
  title?: string;
  subtitle?: string;
}

const CategoriesHeader: React.FC<CategoriesHeaderProps> = ({
  title = 'Mục lục sản phẩm',
  subtitle = 'Danh sách các loại danh mục trong hệ thống'
}) => {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};

export default CategoriesHeader;


