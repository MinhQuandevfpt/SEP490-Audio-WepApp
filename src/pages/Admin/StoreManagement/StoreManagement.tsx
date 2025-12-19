import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { showError } from '../../../utils/notification';
import StoreKycHistoryModal from './StoreKycHistoryModal';

const { Title, Text } = Typography;
const { Search } = Input;

interface StoreData {
  storeId: string;
  storeName: string;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phoneNumber: string;
  email: string;
  rating: number | null;
  status: string;
  accountId: string;
  storeAddresses: any[] | null;
  rejectionReason?: string; // KYC rejection reason
}

const StoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} cửa hàng`,
  });
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState<{ storeId: string; storeName: string } | null>(null);

  // Fetch stores
  const fetchStores = useCallback(async (page: number = 0, size: number = 10) => {
    setIsLoading(true);
    try {
      const response = await AdminStoreService.getAllStoresWithPagination(page, size);
      setStores(response.stores);
      setPagination(prev => ({
        ...prev,
        current: response.currentPage + 1,
        total: response.totalElements,
        pageSize: size,
      }));
      setIsSearching(false);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải danh sách cửa hàng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search stores
  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      fetchStores(0, pagination.pageSize || 10);
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    try {
      const response = await AdminStoreService.searchStores(
        keyword.trim(),
        0,
        pagination.pageSize || 10
      );
      setStores(response.stores);
      setPagination(prev => ({
        ...prev,
        current: response.pagination.pageNumber + 1,
        total: response.pagination.totalElements,
        pageSize: response.pagination.pageSize,
      }));
    } catch (error: any) {
      showError(error?.message || 'Không thể tìm kiếm cửa hàng');
    } finally {
      setIsLoading(false);
    }
  }, [fetchStores, pagination.pageSize]);

  // Initial load
  useEffect(() => {
    fetchStores(0, 10);
  }, []);

  // Handle table change
  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    const page = (newPagination.current || 1) - 1;
    const size = newPagination.pageSize || 10;

    if (isSearching && searchKeyword.trim()) {
      setIsLoading(true);
      AdminStoreService.searchStores(searchKeyword.trim(), page, size)
        .then(response => {
          setStores(response.stores);
          setPagination(prev => ({
            ...prev,
            current: response.pagination.pageNumber + 1,
            total: response.pagination.totalElements,
            pageSize: response.pagination.pageSize,
          }));
        })
        .catch(error => {
          showError(error?.message || 'Không thể tải trang');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      fetchStores(page, size);
    }
  }, [isSearching, searchKeyword, fetchStores]);

  // Handle view detail
  const handleViewDetail = useCallback((storeId: string) => {
    navigate(`/admin/stores/${storeId}`);
  }, [navigate]);

  const handleViewKycHistory = useCallback((storeId: string, storeName: string) => {
    setSelectedStore({ storeId, storeName });
    setKycModalVisible(true);
  }, []);

  const handleCloseKycModal = useCallback(() => {
    setKycModalVisible(false);
    setSelectedStore(null);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setSearchKeyword('');
    setIsSearching(false);
    fetchStores(0, pagination.pageSize || 10);
  }, [fetchStores, pagination.pageSize]);

  // Stats
  const stats = useMemo(() => {
    const total = stores.length;
    const active = stores.filter(s => s.status === 'ACTIVE').length;
    const pending = stores.filter(s => s.status === 'PENDING').length;
    const rejected = stores.filter(s => s.status === 'REJECTED').length;
    const inactive = stores.filter(s => s.status === 'INACTIVE').length;

    return { total, active, pending, rejected, inactive };
  }, [stores]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      ACTIVE: {
        color: 'success',
        text: 'Đang hoạt động',
        icon: <CheckCircleOutlined />
      },
      INACTIVE: {
        color: 'default',
        text: 'Ngừng hoạt động',
        icon: <CloseCircleOutlined />
      },
      PENDING: {
        color: 'processing',
        text: 'Chờ duyệt',
        icon: <ClockCircleOutlined />
      },
      REJECTED: {
        color: 'error',
        text: 'Từ chối',
        icon: <CloseCircleOutlined />
      }
    };

    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Table columns
  const columns: ColumnsType<StoreData> = [
    {
      title: 'Logo',
      dataIndex: 'logoUrl',
      key: 'logoUrl',
      width: 80,
      align: 'center',
      render: (logoUrl, record) => (
        <Avatar
          src={logoUrl}
          icon={!logoUrl && <ShopOutlined />}
          size={48}
          style={{ backgroundColor: !logoUrl ? '#1890ff' : undefined }}
        >
          {!logoUrl && record.storeName?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Tên cửa hàng',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }} copyable>
            ID: {record.storeId}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <MailOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '13px' }}>{record.email}</Text>
          </Space>
          <Space size={4}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '13px' }}>{record.phoneNumber}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status, record) => (
        <Space direction="vertical" size={4}>
          {getStatusBadge(status)}
          {status === 'REJECTED' && record.rejectionReason && (
            <Tooltip title={record.rejectionReason}>
              <Text type="danger" style={{ fontSize: '12px' }} ellipsis>
                {record.rejectionReason}
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.storeId)}
            />
          </Tooltip>
          <Tooltip title="Lịch sử KYC">
            <Button
              type="default"
              icon={<FileTextOutlined />}
              onClick={() => handleViewKycHistory(record.storeId, record.storeName)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý cửa hàng
        </Title>
        <Text type="secondary">
          Xem và quản lý tất cả cửa hàng trên hệ thống
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng cửa hàng"
              value={pagination.total || 0}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Từ chối"
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search & Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Search
                placeholder="Tìm kiếm theo tên cửa hàng..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                loading={isLoading}
              />
            </Col>
            <Col xs={24} md={8}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={isLoading}
                  size="large"
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={stores}
          rowKey="storeId"
          loading={isLoading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description={isSearching ? 'Không tìm thấy cửa hàng nào' : 'Chưa có cửa hàng nào'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* KYC History Modal */}
      {selectedStore && (
        <StoreKycHistoryModal
          visible={kycModalVisible}
          storeId={selectedStore.storeId}
          storeName={selectedStore.storeName}
          onClose={handleCloseKycModal}
        />
      )}
    </div>
  );
};

export default StoreManagement;
