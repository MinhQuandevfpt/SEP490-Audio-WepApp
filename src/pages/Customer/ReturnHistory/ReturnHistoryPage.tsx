import React from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import { Home } from 'lucide-react';
import Layout from '../../../components/Layout';
import useCustomerReturns from '../../../hooks/useCustomerReturns';
import ReturnHistory from '../../../components/ProfilePageComponents/ReturnHistory/ReturnHistory';

const { Title, Text } = Typography;

const ReturnHistoryPage: React.FC = () => {
  const {
    returns,
    page,
    pageSize,
    total,
    isLoading,
    error,
    onPaginationChange,
    reload,
  } = useCustomerReturns();

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
          <Breadcrumb
            items={[
              {
                title: (
                  <Space>
                    <Home className="w-4 h-4" />
                    <span>Tài khoản</span>
                  </Space>
                ),
              },
              { title: 'Lịch sử hoàn trả' },
            ]}
          />

          <div className="flex flex-col gap-1">
            <Title level={2} className="!mb-1 !text-gray-900">
              Lịch sử hoàn trả
            </Title>
            <Text type="secondary" className="text-base">
              Theo dõi toàn bộ yêu cầu hoàn trả sản phẩm của bạn, bao gồm thông tin gói hàng và phí vận chuyển.
            </Text>
          </div>

          <ReturnHistory
            data={returns}
            page={page}
            pageSize={pageSize}
            total={total}
            isLoading={isLoading}
            error={error}
            onPageChange={onPaginationChange}
            onReload={reload}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ReturnHistoryPage;


