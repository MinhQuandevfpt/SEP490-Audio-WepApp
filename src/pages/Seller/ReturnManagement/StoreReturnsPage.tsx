import React from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import { Home, Package } from 'lucide-react';
import useStoreReturns from '../../../hooks/useStoreReturns';
import { StoreReturnList } from '../../../components/StoreOwnerOrderManagementComponents';

const { Title, Text } = Typography;

const StoreReturnsPage: React.FC = () => {
  const {
    returns,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    error,
    onPaginationChange,
    reload,
  } = useStoreReturns();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          {
            title: (
              <Space>
                <Home className="w-4 h-4" />
                <span>Quản lý đơn hàng</span>
              </Space>
            ),
          },
          { title: 'Hoàn trả sản phẩm' },
        ]}
      />

      <div>
        <Title level={3} className="!mb-1">
          Hoàn trả sản phẩm
        </Title>
        <Text type="secondary">
          Theo dõi và xử lý các yêu cầu hoàn trả từ khách hàng
        </Text>
      </div>

      <StoreReturnList
        data={returns}
        page={page}
        pageSize={pageSize}
        total={total}
        isLoading={isLoading}
        error={error}
        onPageChange={onPaginationChange}
        onReload={reload}
      />

      {totalPages === 0 && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Package className="w-3 h-3" />
          <span>Chưa có yêu cầu hoàn trả nào trong hệ thống.</span>
        </div>
      )}
    </div>
  );
};

export default StoreReturnsPage;


