import React, { useMemo } from 'react';
import { Clock, CheckCircle, XCircle, FileCheck } from 'lucide-react';
import type { KycData } from '../../../types/admin';

interface KycStatsCardsProps {
  kycRequests: KycData[];
  isLoading?: boolean;
}

interface StatItem {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'red';
  bgColor: string;
  textColor: string;
}

const KycStatsCards: React.FC<KycStatsCardsProps> = ({ kycRequests, isLoading = false }) => {
  const stats = useMemo(() => {
    const totalKyc = kycRequests.length;
    const pendingKyc = kycRequests.filter(k => k.status === 'PENDING').length;
    const approvedKyc = kycRequests.filter(k => k.status === 'APPROVED').length;
    const rejectedKyc = kycRequests.filter(k => k.status === 'REJECTED').length;

    const statItems: StatItem[] = [
      {
        title: 'Tổng yêu cầu',
        value: totalKyc,
        icon: <FileCheck className="w-6 h-6" />,
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
      },
      {
        title: 'Chờ duyệt',
        value: pendingKyc,
        icon: <Clock className="w-6 h-6" />,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-600'
      },
      {
        title: 'Đã duyệt',
        value: approvedKyc,
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600'
      },
      {
        title: 'Đã từ chối',
        value: rejectedKyc,
        icon: <XCircle className="w-6 h-6" />,
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600'
      }
    ];

    return statItems;
  }, [kycRequests]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gray-200 rounded-md"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.bgColor} rounded-md p-3`}>
                  <div className={stat.textColor}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KycStatsCards;
