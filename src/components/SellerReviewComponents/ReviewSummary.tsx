import React from 'react';
import { Card, Progress } from 'antd';
import { Star } from 'lucide-react';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: number[];
}

const labels = ['1 sao', '2 sao', '3 sao', '4 sao', '5 sao'];

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ averageRating, totalReviews, ratingBreakdown }) => {
  const fullStars = Math.round(averageRating);
  const renderStar = (index: number) => {
    const active = index < fullStars;
    return (
      <Star
        key={`star-${index}`}
        className={`w-7 h-7 ${active ? 'text-orange-500 fill-orange-500' : 'text-gray-200'}`}
      />
    );
  };

  return (
    <Card className="shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center justify-center border-r border-gray-100 space-y-3">
          <div className="flex flex-col gap-1 items-center">
            <div className="flex gap-2">{[0, 1, 2].map((i) => renderStar(i))}</div>
            <div className="flex gap-2">{[3, 4].map((i) => renderStar(i))}</div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Trung bình · {totalReviews} đánh giá</p>
        </div>

        <div className="md:col-span-2 space-y-3">
          {ratingBreakdown
            .map((value, index) => ({ label: labels[index], value }))
            .reverse()
            .map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-600 text-right">{labels[4 - idx]}</span>
                <Progress
                  percent={totalReviews ? Math.round((item.value / totalReviews) * 100) : 0}
                  showInfo={false}
                  strokeColor="#fa8c16"
                  className="flex-1"
                />
                <span className="w-10 text-sm text-gray-500">{item.value}</span>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
};

export default ReviewSummary;

