import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-medium text-yellow-900 mb-2">Hướng dẫn sử dụng</h3>
      <ul className="text-sm text-yellow-800 space-y-1">
        <li>• Kéo chuột để xoay camera</li>
        <li>• Cuộn chuột để zoom</li>
        <li>• Giữ chuột phải để di chuyển</li>
        <li>• Điều chỉnh thanh trượt để thay đổi kích thước</li>
      </ul>
    </div>
  );
};

export default Instructions;
