import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, desc }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;


