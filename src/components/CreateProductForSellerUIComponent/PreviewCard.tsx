import React from 'react';

interface PreviewCardProps {
  form: Record<string, any>;
  images: { url: string }[];
}

const PreviewCard: React.FC<PreviewCardProps> = ({ form, images }) => {
  return (
    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-4">
      <div className="text-sm font-semibold text-gray-800 mb-3">Xem trước</div>
      <div className="border rounded-lg p-3">
        <div className="text-gray-900 font-medium">{form.name || 'Tên sản phẩm'}</div>
        <div className="text-xs text-gray-500">{form.brand || 'Thương hiệu'}</div>
        <div className="text-sm text-gray-800 mt-2">{form.price ? Number(form.price).toLocaleString() + '₫' : 'Giá'}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {images.length > 0 ? (
            images.slice(0, 3).map((img, i) => (
              <img key={i} src={img.url} className="w-full h-20 object-cover rounded" />
            ))
          ) : (
            <div className="col-span-3 text-xs text-gray-400">Chưa có ảnh</div>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-600">
          <div>Thương hiệu: {form.brand || '-'}</div>
          <div>Kiểu kết nối: {form.connection || '-'}</div>
          <div>Hạn bảo hành: {form.warrantyMonths ? `${form.warrantyMonths} tháng` : '-'}</div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;


