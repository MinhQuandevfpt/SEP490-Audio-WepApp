import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Spin, Typography, Button } from 'antd';
import { Shield, Wrench, Calendar, ExternalLink } from 'lucide-react';
import { WarrantyService } from '../../../services/customer/WarrantyService';
import type { Warranty } from '../../../types/api';
import { formatDate } from '../../../utils/orderStatus';

const { Text, Title } = Typography;

const WarrantyComponent: React.FC = () => {
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load warranties
  useEffect(() => {
    const loadWarranties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await WarrantyService.getWarrantiesByEmail();
        setWarranties(data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải danh sách bảo hành');
        setWarranties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWarranties();
  }, []);

  const handleViewAll = () => {
    navigate('/warranty');
  };

  const handleRepair = (warrantyId: string) => {
    // Navigate to warranty page with repair action
    navigate('/warranty', { state: { warrantyId, action: 'repair' } });
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="!mb-1 !text-gray-900">Bảo hành sản phẩm</Title>
            <Text type="secondary" className="text-sm">Danh sách sản phẩm đang được bảo hành</Text>
          </div>
          {warranties.length > 0 && (
            <Button
              type="primary"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={handleViewAll}
              style={{ 
                backgroundColor: '#f97316', 
                borderColor: '#f97316',
                borderRadius: '8px'
              }}
            >
              Xem tất cả
            </Button>
          )}
        </div>
      }
      className="shadow-sm border-gray-200"
      styles={{ body: { padding: '24px' } }}
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" style={{ color: '#f97316' }} />
          <p className="mt-4 text-gray-500">Đang tải danh sách bảo hành...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <Text type="danger" className="text-base">{error}</Text>
        </div>
      ) : warranties.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p className="text-gray-600 font-medium mb-1">Bạn chưa có sản phẩm nào được bảo hành</p>
              <p className="text-sm text-gray-400">Các sản phẩm đã giao hàng thành công sẽ tự động được bảo hành</p>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {warranties.slice(0, 3).map((warranty, index) => (
            <Card
              key={warranty.id || `warranty-${index}`}
              className="border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
              styles={{ body: { padding: '20px' } }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <Title level={5} className="!mb-1 !text-gray-900">
                        {warranty.productName}
                      </Title>
                      <Text type="secondary" className="text-sm">
                        {warranty.storeName}
                      </Text>
                    </div>
                    {warranty.stillValid ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Còn hiệu lực
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Hết hạn
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Text type="secondary" className="text-xs">Ngày mua</Text>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <Text className="text-sm font-medium">{formatDate(warranty.purchaseDate)}</Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">Bắt đầu</Text>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <Text className="text-sm font-medium">
                          {warranty.startDate ? formatDate(warranty.startDate) : 'Chưa kích hoạt'}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">Kết thúc</Text>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <Text className="text-sm font-medium">
                          {warranty.endDate ? formatDate(warranty.endDate) : 'Chưa kích hoạt'}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">Thời hạn</Text>
                      <Text className="text-sm font-medium block mt-1">
                        {warranty.durationMonths} tháng
                      </Text>
                    </div>
                  </div>

                  {warranty.serialNumber && (
                    <div className="mb-3">
                      <Text type="secondary" className="text-xs">Số seri: </Text>
                      <Text className="text-sm font-mono font-medium">{warranty.serialNumber}</Text>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {warranty.stillValid && warranty.id && (
                    <Button
                      type="primary"
                      icon={<Wrench className="w-4 h-4" />}
                      onClick={() => handleRepair(warranty.id!)}
                      style={{ 
                        backgroundColor: '#f97316', 
                        borderColor: '#f97316',
                        borderRadius: '8px'
                      }}
                    >
                      Sửa chữa
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {warranties.length > 3 && (
            <div className="text-center pt-4">
              <Button
                type="primary"
                block
                icon={<ExternalLink className="w-4 h-4" />}
                onClick={handleViewAll}
                style={{ 
                  backgroundColor: '#f97316', 
                  borderColor: '#f97316',
                  borderRadius: '8px'
                }}
              >
                Xem tất cả bảo hành ({warranties.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WarrantyComponent;

