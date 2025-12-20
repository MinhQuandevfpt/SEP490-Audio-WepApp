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
  Modal,
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
  PoweroffOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import { showError, showSuccess } from '../../../utils/notification';
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultData, setResultData] = useState<{
    success: number;
    failed: number;
    details: Array<{ storeId: string; storeName: string; success: boolean; message: string }>;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    setSelectedRowKeys([]);
    fetchStores(0, pagination.pageSize || 10);
  }, [fetchStores, pagination.pageSize]);

  // Check if selected stores can be activated/deactivated
  const canActivate = useMemo(() => {
    if (selectedRowKeys.length === 0) return false;
    // Can activate if at least one store is not ACTIVE
    return selectedRowKeys.some(key => {
      const store = stores.find(s => s.storeId === key);
      return store && store.status !== 'ACTIVE';
    });
  }, [selectedRowKeys, stores]);

  const canDeactivate = useMemo(() => {
    if (selectedRowKeys.length === 0) return false;
    // Can deactivate if at least one store is not INACTIVE
    return selectedRowKeys.some(key => {
      const store = stores.find(s => s.storeId === key);
      return store && store.status !== 'INACTIVE';
    });
  }, [selectedRowKeys, stores]);

  // Handle row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record: StoreData) => ({
      disabled: false,
      name: record.storeName,
    }),
  };

  // Handle activate/deactivate
  const handleActivate = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showError('Vui lòng chọn ít nhất một cửa hàng');
      return;
    }
    if (!canActivate) {
      showError('Tất cả cửa hàng đã chọn đều đang ở trạng thái ACTIVE');
      return;
    }
    setConfirmAction('activate');
    setConfirmModalVisible(true);
  }, [selectedRowKeys, canActivate]);

  const handleDeactivate = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showError('Vui lòng chọn ít nhất một cửa hàng');
      return;
    }
    if (!canDeactivate) {
      showError('Tất cả cửa hàng đã chọn đều đang ở trạng thái INACTIVE');
      return;
    }
    setConfirmAction('deactivate');
    setConfirmModalVisible(true);
  }, [selectedRowKeys, canDeactivate]);

  // Execute status update
  const executeStatusUpdate = useCallback(async () => {
    if (!confirmAction || selectedRowKeys.length === 0) return;

    setIsUpdating(true);
    setConfirmModalVisible(false);

    const targetStatus = confirmAction === 'activate' ? 'ACTIVE' : 'INACTIVE';
    const results: Array<{ storeId: string; storeName: string; success: boolean; message: string }> = [];

    // Update stores sequentially to avoid overwhelming the server
    for (const storeId of selectedRowKeys) {
      const store = stores.find(s => s.storeId === storeId);
      if (!store) continue;

      try {
        const response = await AdminStoreService.updateStoreStatus(storeId as string, targetStatus);
        results.push({
          storeId: storeId as string,
          storeName: store.storeName,
          success: true,
          message: response?.message || `Đã ${confirmAction === 'activate' ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
        });
      } catch (error: any) {
        results.push({
          storeId: storeId as string,
          storeName: store.storeName,
          success: false,
          message: error?.message || 'Có lỗi xảy ra',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    setResultData({
      success: successCount,
      failed: failedCount,
      details: results,
    });
    setResultModalVisible(true);
    setSelectedRowKeys([]);
    setIsUpdating(false);

    // Refresh store list
    if (isSearching && searchKeyword.trim()) {
      handleSearch(searchKeyword);
    } else {
      fetchStores((pagination.current || 1) - 1, pagination.pageSize || 10);
    }

    if (successCount > 0) {
      showSuccess(
        `Đã ${confirmAction === 'activate' ? 'kích hoạt' : 'vô hiệu hóa'} ${successCount} cửa hàng thành công`,
        'Thành công'
      );
    }
    if (failedCount > 0) {
      showError(`Có ${failedCount} cửa hàng cập nhật thất bại`);
    }
  }, [confirmAction, selectedRowKeys, stores, isSearching, searchKeyword, pagination, handleSearch, fetchStores]);

  const handleConfirmOk = useCallback(() => {
    executeStatusUpdate();
  }, [executeStatusUpdate]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
  }, []);

  const handleResultModalClose = useCallback(() => {
    setResultModalVisible(false);
    setResultData(null);
  }, []);

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
      },
      SUSPENDED_DEBT: {
        color: 'error',
        text: 'Tạm khoá do nợ',
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý cửa hàng
          </Title>
          <Text type="secondary">
            Xem và quản lý tất cả cửa hàng trên hệ thống
          </Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
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
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={16}>
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
            <Col xs={24} lg={8}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleActivate}
                  disabled={isLoading || isUpdating || !canActivate}
                  size="large"
                >
                  Kích hoạt ({selectedRowKeys.length})
                </Button>
                <Button
                  danger
                  icon={<PoweroffOutlined />}
                  onClick={handleDeactivate}
                  disabled={isLoading || isUpdating || !canDeactivate}
                  size="large"
                >
                  Vô hiệu hóa ({selectedRowKeys.length})
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={isLoading || isUpdating}
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
          loading={isLoading || isUpdating}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={rowSelection}
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

      {/* Confirm Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>Xác nhận thay đổi trạng thái</span>
          </Space>
        }
        open={confirmModalVisible}
        onOk={handleConfirmOk}
        onCancel={handleConfirmCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: isUpdating }}
        width={500}
      >
        <div style={{ marginTop: '16px' }}>
          <Text>
            Bạn có chắc chắn muốn{' '}
            <Text strong>
              {confirmAction === 'activate' ? 'kích hoạt' : 'vô hiệu hóa'}
            </Text>{' '}
            <Text strong style={{ color: '#1890ff' }}>
              {selectedRowKeys.length}
            </Text>{' '}
            cửa hàng đã chọn?
          </Text>
          {confirmAction === 'activate' && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                Tất cả sản phẩm của cửa hàng sẽ chuyển về trạng thái ACTIVE.
              </Text>
            </div>
          )}
          {confirmAction === 'deactivate' && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff1f0', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                Cửa hàng sẽ chuyển sang trạng thái INACTIVE (ngừng hoạt động).
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal
        title="Kết quả cập nhật trạng thái"
        open={resultModalVisible}
        onCancel={handleResultModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleResultModalClose}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {resultData && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Summary */}
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Thành công"
                        value={resultData.success}
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Thất bại"
                        value={resultData.failed}
                        prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Details */}
              {resultData.details.length > 0 && (
                <div>
                  <Text strong>Chi tiết:</Text>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {resultData.details.map((detail, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: detail.success ? '#f6ffed' : '#fff1f0',
                            borderRadius: '4px',
                            border: `1px solid ${detail.success ? '#b7eb8f' : '#ffccc7'}`,
                          }}
                        >
                          <Space>
                            {detail.success ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            )}
                            <Text strong>{detail.storeName}</Text>
                            <Text type="secondary">({detail.storeId.slice(0, 8)}...)</Text>
                            <Text type={detail.success ? 'success' : 'danger'} style={{ fontSize: '12px' }}>
                              {detail.message}
                            </Text>
                          </Space>
                        </div>
                      ))}
                    </Space>
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* KYC History Modal */}
      {selectedStore && (
        <StoreKycHistoryModal
          visible={kycModalVisible}
          storeId={selectedStore.storeId}
          storeName={selectedStore.storeName}
          onClose={handleCloseKycModal}
        />
      )}
    </Space>
  );
};

export default StoreManagement;
