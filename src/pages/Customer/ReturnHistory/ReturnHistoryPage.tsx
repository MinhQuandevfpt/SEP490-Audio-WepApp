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
  } = useCustomerReturns();

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

          <div>
            <Title level={2} className="!mb-1 !text-gray-900">
              Lịch sử hoàn trả
            </Title>
            <Text type="secondary" className="text-base">
              Theo dõi toàn bộ yêu cầu hoàn trả sản phẩm của bạn
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
          />
        </div>
      </div>
    </Layout>
  );
};

export default ReturnHistoryPage;


