import React from 'react';

const TestComponent: React.FC = () => {
  // This component will always render without errors
  return (
    <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
      <h3 className="text-green-800 font-semibold">✅ Test Component Loaded Successfully</h3>
      <p className="text-green-700">Nếu bạn thấy component này, có nghĩa là ứng dụng đã hoạt động bình thường.</p>
    </div>
  );
};

export default TestComponent;
