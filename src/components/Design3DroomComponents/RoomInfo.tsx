import React from 'react';

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface RoomInfoProps {
  dimensions: Dimensions;
}

const RoomInfo: React.FC<RoomInfoProps> = ({ dimensions }) => {
  const area = dimensions.length * dimensions.width;
  const volume = dimensions.length * dimensions.width * dimensions.height;
  const perimeter = (dimensions.length + dimensions.width) * 2;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-2">Thông tin phòng</h3>
      <div className="space-y-1 text-sm text-blue-800">
        <div>Diện tích: {area.toFixed(1)} m²</div>
        <div>Thể tích: {volume.toFixed(1)} m³</div>
        <div>Chu vi: {perimeter.toFixed(1)} m</div>
      </div>
    </div>
  );
};

export default RoomInfo;
