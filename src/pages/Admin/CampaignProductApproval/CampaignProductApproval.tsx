import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, Tag, Button, Modal, Space, Card, Row, Col, Statistic, 
  Select, Image, Alert, Empty, Typography
} from 'antd';
import {
  CheckCircleOutlined,
  ShopOutlined,
  TagOutlined,
  ClockCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { CampaignProductService } from '../../../services/admin/CampaignProductService';
import type { 
  CampaignProduct, 
  CampaignOverviewItem,
  CampaignType,
  VoucherStatus,
  Campaign
} from '../../../types/admin';
import { showTikiNotification } from '../../../utils/notification';

const { Option } = Select;
const { Title, Text } = Typography;

const CampaignProductApproval: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignOverviewItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<CampaignType | undefined>();
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | undefined>('DRAFT');
  const [filterCampaignId, setFilterCampaignId] = useState<string | undefined>();
  const [filterStoreId, setFilterStoreId] = useState<string | undefined>();
  
  // Pagination
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `Tổng ${total} sản phẩm`,
  });

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  useEffect(() => {
    fetchCampaignOverview();
  }, [filterType, filterStatus, filterCampaignId, filterStoreId, pagination.current, pagination.pageSize]);

  const fetchAllCampaigns = async () => {
    try {
      const campaigns = await CampaignProductService.getAllCampaignsForFilter();
      setAllCampaigns(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchCampaignOverview = async () => {
    setLoading(true);
    try {
      const response = await CampaignProductService.getCampaignOverview({
        type: filterType,
        status: filterStatus,
        campaignId: filterCampaignId,
        storeId: filterStoreId,
        page: (pagination.current || 1) - 1,
        size: pagination.pageSize || 20
      });

      setCampaignData(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalCampaigns * 10 // Approximate total products
      }));
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể tải danh sách sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Flatten products from all campaigns for table display
  const allProducts = useMemo(() => {
    const products: (CampaignProduct & { campaignId: string; campaignName: string; campaignType: CampaignType })[] = [];
    campaignData.forEach(campaign => {
      campaign.products.forEach(product => {
        products.push({
          ...product,
          campaignId: campaign.campaignId,
          campaignName: campaign.campaignName,
          campaignType: campaign.campaignType
        });
      });
    });
    return products;
  }, [campaignData]);

  // Statistics
  const stats = useMemo(() => {
    const total = allProducts.length;
    const draft = allProducts.filter(p => p.voucher.status === 'DRAFT').length;
    const approved = allProducts.filter(p => p.voucher.status === 'APPROVE').length;
    const uniqueStores = new Set(allProducts.map(p => p.storeId)).size;

    return { total, draft, approved, uniqueStores };
  }, [allProducts]);

  const handleApproveSelected = useCallback(() => {
    if (selectedProducts.length === 0) {
      showTikiNotification('Vui lòng chọn ít nhất một sản phẩm', 'Thông báo', 'error');
      return;
    }

    setShowConfirmModal(true);
  }, [selectedProducts]);

  const handleConfirmApprove = useCallback(async () => {
    // Group by campaignId
    const productsByCampaign = selectedProducts.reduce<Record<string, string[]>>((acc, productId) => {
      const product = allProducts.find(p => p.campaignProductId === productId);
      if (product) {
        if (!acc[product.campaignId]) {
          acc[product.campaignId] = [];
        }
        acc[product.campaignId].push(productId);
      }
      return acc;
    }, {});

    try {
      setShowConfirmModal(false);
      setLoading(true);
      
      // Approve products for each campaign
      const promises = Object.entries(productsByCampaign).map(([campaignId, productIds]) =>
        CampaignProductService.approveProducts(campaignId, productIds)
      );

      await Promise.all(promises);

      showTikiNotification(
        `Đã duyệt thành công ${selectedProducts.length} sản phẩm!`,
        'Thành công',
        'success'
      );

      setSelectedProducts([]);
      fetchCampaignOverview();
    } catch (error: any) {
      showTikiNotification(
        error.message || 'Không thể duyệt sản phẩm',
        'Lỗi',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProducts, allProducts]);

  const handleClearFilters = () => {
    setFilterType(undefined);
    setFilterStatus('DRAFT');
    setFilterCampaignId(undefined);
    setFilterStoreId(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns: ColumnsType<CampaignProduct & { campaignId: string; campaignName: string; campaignType: CampaignType }> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 300,
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <Image
            src={record.productImage}
            alt={record.productName}
            width={60}
            height={60}
            className="rounded object-cover"
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 line-clamp-2">{record.productName}</div>
            <div className="text-xs text-gray-500 mt-1">ID: {record.productId.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      title: 'Chiến dịch',
      dataIndex: 'campaignName',
      key: 'campaignName',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.campaignName}</div>
          <Tag color={record.campaignType === 'MEGA_SALE' ? 'purple' : 'orange'} className="mt-1">
            {record.campaignType === 'MEGA_SALE' ? 'Mega Sale' : 'Flash Sale'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 180,
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-1">
            <ShopOutlined className="text-gray-400" />
            <span className="text-sm">{record.storeName}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">ID: {record.storeId.slice(0, 8)}...</div>
        </div>
      )
    },
    {
      title: 'Giá gốc',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 120,
      align: 'right',
      render: (price: number) => (
        <span className="text-gray-600">{price.toLocaleString('vi-VN')}₫</span>
      )
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <Tag color="red" className="font-bold">
            {CampaignProductService.formatDiscount(record.voucher)}
          </Tag>
          {record.voucher.type === 'PERCENT' && record.voucher.maxDiscountValue && (
            <div className="text-xs text-gray-400 mt-1">
              Tối đa: {record.voucher.maxDiscountValue.toLocaleString('vi-VN')}₫
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Giá sau giảm',
      key: 'finalPrice',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const finalPrice = CampaignProductService.calculateDiscountedPrice(
          record.originalPrice,
          record.voucher
        );
        return (
          <span className="text-red-600 font-bold">
            {finalPrice.toLocaleString('vi-VN')}₫
          </span>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: ['voucher', 'status'],
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: VoucherStatus) => (
        <Tag color={CampaignProductService.getVoucherStatusColor(status)}>
          {CampaignProductService.getVoucherStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 180,
      render: (_, record) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <ClockCircleOutlined />
            <span>{new Date(record.voucher.startTime).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="text-gray-400 mt-1">
            đến {new Date(record.voucher.endTime).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys: selectedProducts,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedProducts(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record: CampaignProduct & { campaignId: string; campaignName: string; campaignType: CampaignType }) => ({
      disabled: !['DRAFT', 'APPROVE'].includes(record.voucher.status),
      name: record.productName
    })
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <CheckCircleOutlined className="mr-2" />
            Duyệt sản phẩm chiến dịch
          </Title>
          <Text type="secondary">
            Quản lý và phê duyệt sản phẩm tham gia các chiến dịch khuyến mãi
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={stats.total}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Chờ duyệt"
                value={stats.draft}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Cửa hàng tham gia"
                value={stats.uniqueStores}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FilterOutlined />
            <Text strong>Bộ lọc</Text>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Loại chiến dịch</Text>
              <Select
                placeholder="Tất cả"
                value={filterType}
                onChange={setFilterType}
                allowClear
                className="w-full"
              >
                <Option value="MEGA_SALE">Mega Sale</Option>
                <Option value="FAST_SALE">Flash Sale</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Trạng thái</Text>
              <Select
                placeholder="Tất cả"
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
                className="w-full"
              >
                <Option value="DRAFT">Chờ duyệt</Option>
                <Option value="APPROVE">Đã duyệt</Option>
                <Option value="ACTIVE">Đang hoạt động</Option>
                <Option value="EXPIRED">Hết hạn</Option>
                <Option value="DISABLED">Vô hiệu hóa</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">Chiến dịch</Text>
              <Select
                placeholder="Tất cả chiến dịch"
                value={filterCampaignId}
                onChange={setFilterCampaignId}
                allowClear
                showSearch
                optionFilterProp="children"
                className="w-full"
              >
                {allCampaigns.map(campaign => (
                  <Option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" className="block mb-1">&nbsp;</Text>
              <Button onClick={handleClearFilters} block>
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Action Bar */}
        {selectedProducts.length > 0 && (
          <Alert
            message={
              <div className="flex items-center justify-between">
                <span>Đã chọn <strong>{selectedProducts.length}</strong> sản phẩm</span>
                <Space>
                  <Button onClick={() => setSelectedProducts([])}>
                    Bỏ chọn
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApproveSelected}
                  >
                    Duyệt đã chọn
                  </Button>
                </Space>
              </div>
            }
            type="info"
            className="mb-4"
          />
        )}

        {/* Products Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={allProducts}
            rowKey="campaignProductId"
            loading={loading}
            pagination={pagination}
            onChange={(newPagination) => setPagination(newPagination)}
            rowSelection={rowSelection}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <div>
                      <p className="text-gray-600 mb-2">Không có sản phẩm nào</p>
                      <p className="text-sm text-gray-400">
                        Thử thay đổi bộ lọc hoặc đợi cửa hàng đăng ký sản phẩm
                      </p>
                    </div>
                  }
                />
              )
            }}
          />
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận duyệt sản phẩm"
        open={showConfirmModal}
        onOk={handleConfirmApprove}
        onCancel={() => setShowConfirmModal(false)}
        okText="Duyệt"
        cancelText="Hủy"
        okButtonProps={{ 
          icon: <CheckCircleOutlined />,
          loading: loading
        }}
        zIndex={2000}
        centered
      >
        <div>
          <p>Bạn có chắc chắn muốn duyệt <strong>{selectedProducts.length}</strong> sản phẩm đã chọn?</p>
          <Alert
            message="Lưu ý"
            description="Sản phẩm sẽ chuyển sang trạng thái 'Đã duyệt' và chỉ ACTIVE khi chiến dịch hoặc slot bắt đầu."
            type="info"
            showIcon
            className="mt-3"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CampaignProductApproval;
