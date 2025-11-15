import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Table, Card, Empty, Spin, Typography, Button, Tag, Row, Col, Statistic, Descriptions, Divider, Image } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Shield, Wrench, Package, Store, ArrowLeft, CheckCircle } from 'lucide-react';
import { WarrantyService } from '../../../services/customer/WarrantyService';
import RequestRepairModal from '../../../components/WarrantyComponents/RequestRepairModal';
import type { Warranty, WarrantyLog, WarrantyLogStatus } from '../../../types/api';
import { formatDate, formatCurrency } from '../../../utils/orderStatus';

const { Text, Title } = Typography;

interface WarrantyWithLogs extends Warranty {
  logs?: WarrantyLog[];
  logsLoading?: boolean;
  logsLoaded?: boolean; // Track if logs have been loaded at least once
}

const WarrantyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState<WarrantyWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  // Load warranties
  const loadWarranties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await WarrantyService.getWarrantiesByEmail();
      const activeWarranties = data.filter(
        w => w.id !== null && w.status === 'ACTIVE' && w.stillValid && w.startDate !== null && w.endDate !== null
      );
      setWarranties(activeWarranties.map(w => ({ ...w, logs: [], logsLoading: false, logsLoaded: false })));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bảo hành');
      setWarranties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

  // Handle repair action from navigation state
  useEffect(() => {
    const state = location.state as { warrantyId?: string; action?: string } | null;
    if (state?.warrantyId && state?.action === 'repair') {
      setExpandedRowKeys([state.warrantyId]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load logs for a warranty
  const loadWarrantyLogs = useCallback(async (warrantyId: string) => {
    if (!warrantyId) return;

    // Update loading state
    setWarranties(prev =>
      prev.map(w => (w.id === warrantyId ? { ...w, logsLoading: true } : w))
    );

    try {
      console.log('🔍 Loading warranty logs for:', warrantyId);
      const logs = await WarrantyService.getWarrantyLogs(warrantyId);
      console.log('✅ Warranty logs loaded:', logs);
      console.log('📊 Logs array length:', logs.length);
      setWarranties(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs, logsLoading: false, logsLoaded: true } : w))
      );
    } catch (err: any) {
      console.error('❌ Error loading warranty logs:', err);
      setWarranties(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs: [], logsLoading: false, logsLoaded: true } : w))
      );
    }
  }, []);

  // Handle expand row
  const handleExpand = useCallback((expanded: boolean, record: WarrantyWithLogs) => {
    console.log('🔄 Handle expand:', { 
      expanded, 
      warrantyId: record.id, 
      hasLogs: !!record.logs, 
      logsLength: record.logs?.length,
      logsLoaded: record.logsLoaded,
      logsLoading: record.logsLoading
    });
    if (expanded && record.id && !record.logsLoaded && !record.logsLoading) {
      // Load logs if not loaded yet
      console.log('📥 Loading logs for warranty:', record.id);
      loadWarrantyLogs(record.id);
    }
  }, [loadWarrantyLogs]);

  // Check if warranty has active repair request
  const hasActiveRepair = (warranty: WarrantyWithLogs): boolean => {
    if (!warranty.logs || warranty.logs.length === 0) return false;
    return warranty.logs.some(
      log => log.status !== 'COMPLETED' && log.status !== 'CLOSED'
    );
  };

  const getStatusColor = (warranty: Warranty) => {
    if (!warranty.stillValid) return 'red';
    if (warranty.status === 'ACTIVE') return 'green';
    if (warranty.status === 'EXPIRED') return 'red';
    if (warranty.status === 'VOID') return 'default';
    if (warranty.status === 'TRANSFERRED') return 'blue';
    if (warranty.status === 'PENDING_ACTIVATION') return 'orange';
    return 'default';
  };

  const getStatusText = (warranty: Warranty) => {
    if (!warranty.stillValid) return 'Hết hạn';
    if (warranty.status === 'ACTIVE') return 'Còn hiệu lực';
    if (warranty.status === 'EXPIRED') return 'Đã hết hạn';
    if (warranty.status === 'VOID') return 'Đã hủy';
    if (warranty.status === 'TRANSFERRED') return 'Đã chuyển nhượng';
    if (warranty.status === 'PENDING_ACTIVATION') return 'Chờ kích hoạt';
    return warranty.status;
  };

  const getLogStatusColor = (status: WarrantyLogStatus): string => {
    const colorMap: Record<WarrantyLogStatus, string> = {
      OPEN: 'orange',
      DIAGNOSING: 'blue',
      WAITING_PARTS: 'gold',
      REPAIRING: 'purple',
      READY_FOR_PICKUP: 'cyan',
      SHIP_BACK: 'geekblue',
      COMPLETED: 'green',
      CLOSED: 'default',
    };
    return colorMap[status] || 'default';
  };

  const getLogStatusText = (status: WarrantyLogStatus): string => {
    const textMap: Record<WarrantyLogStatus, string> = {
      OPEN: 'Chờ xử lý',
      DIAGNOSING: 'Đang chẩn đoán',
      WAITING_PARTS: 'Chờ linh kiện',
      REPAIRING: 'Đang sửa chữa',
      READY_FOR_PICKUP: 'Sẵn sàng lấy hàng',
      SHIP_BACK: 'Đang trả hàng',
      COMPLETED: 'Đã hoàn tất',
      CLOSED: 'Đã đóng',
    };
    return textMap[status] || status;
  };

  const handleRepairClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
  };

  const handleRepairSuccess = () => {
    if (selectedWarranty?.id) {
      loadWarrantyLogs(selectedWarranty.id);
      setExpandedRowKeys(prev => {
        if (!prev.includes(selectedWarranty?.id || '')) {
          return [...prev, selectedWarranty.id!];
        }
        return prev;
      });
    }
    setSelectedWarranty(null);
  };

  const columns: ColumnsType<WarrantyWithLogs> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{record.productName}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Store className="w-3 h-3" />
              {record.storeName}
            </div>
            {record.serialNumber && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <Package className="w-3 h-3" />
                Số seri: {record.serialNumber}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record)}>{getStatusText(record)}</Tag>
      ),
    },
    {
      title: 'Thời hạn',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">{record.durationMonths} tháng</div>
          <div className="text-xs text-gray-500">
            {record.startDate ? formatDate(record.startDate).split(',')[0] : 'Chưa kích hoạt'}
          </div>
        </div>
      ),
    },
    {
      title: 'Lịch sử sửa chữa',
      key: 'repairHistory',
      render: (_, record) => {
        const logs = record.logs || [];
        const activeLogs = logs.filter(log => log.status !== 'COMPLETED' && log.status !== 'CLOSED');
        const completedLogs = logs.filter(log => log.status === 'COMPLETED' || log.status === 'CLOSED');
        
        return (
          <div>
            {activeLogs.length > 0 && (
              <Tag color="orange" className="mb-1">
                {activeLogs.length} đang xử lý
              </Tag>
            )}
            {completedLogs.length > 0 && (
              <Tag color="green">
                {completedLogs.length} đã hoàn thành
              </Tag>
            )}
            {logs.length === 0 && (
              <Text type="secondary" className="text-xs">Chưa có</Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const canRepair = record.stillValid && record.status === 'ACTIVE' && !hasActiveRepair(record);
        
        return (
          <Button
            type="primary"
            icon={<Wrench className="w-4 h-4" />}
            onClick={() => handleRepairClick(record)}
            disabled={!canRepair}
            size="small"
            style={{
              backgroundColor: canRepair ? '#f97316' : undefined,
              borderColor: canRepair ? '#f97316' : undefined,
            }}
            title={!canRepair ? (hasActiveRepair(record) ? 'Đang có yêu cầu sửa chữa đang xử lý' : 'Không thể yêu cầu sửa chữa') : 'Yêu cầu sửa chữa'}
          >
            Sửa chữa
          </Button>
        );
      },
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/account')}
            className="mb-4"
          >
            Quay lại
          </Button>
          <Title level={2} className="!mb-2">Bảo hành sản phẩm</Title>
          <Text type="secondary">
            Quản lý và yêu cầu sửa chữa cho các sản phẩm đã mua
          </Text>
        </div>

        {/* Statistics */}
        {warranties.length > 0 && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Tổng số bảo hành"
                  value={warranties.length}
                  prefix={<Shield className="w-4 h-4" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Còn hiệu lực"
                  value={warranties.filter(w => w.stillValid).length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircle className="w-4 h-4" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Hết hạn"
                  value={warranties.filter(w => !w.stillValid).length}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Warranty Table */}
        <Card className="bg-white rounded-xl border border-gray-200">
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
                  <p className="text-sm text-gray-400">
                    Các sản phẩm từ đơn hàng đã giao hàng thành công sẽ tự động được bảo hành
                  </p>
                </div>
              }
            />
          ) : (
            <Table
              rowKey={(record) => record.id || `warranty-${record.productId}`}
              columns={columns}
              dataSource={warranties}
              loading={isLoading}
              expandable={{
                expandedRowKeys,
                onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
                onExpand: handleExpand,
                expandedRowRender: (record) => {
                  console.log('🔍 Rendering expanded row for warranty:', record.id);
                  console.log('📋 Logs state:', record.logs);
                  console.log('⏳ Logs loading:', record.logsLoading);

                  if (record.logsLoading) {
                    return (
                      <div className="py-8 text-center">
                        <Spin size="small" />
                        <p className="mt-2 text-sm text-gray-500">Đang tải lịch sử sửa chữa...</p>
                      </div>
                    );
                  }

                  // If logs haven't been loaded yet, trigger load
                  if (!record.logsLoaded && !record.logsLoading && record.id) {
                    setTimeout(() => {
                      loadWarrantyLogs(record.id!);
                    }, 0);
                    return (
                      <div className="py-8 text-center">
                        <Spin size="small" />
                        <p className="mt-2 text-sm text-gray-500">Đang tải lịch sử sửa chữa...</p>
                      </div>
                    );
                  }

                  const logs = record.logs || [];
                  console.log('📊 Logs to render:', logs);

                  if (logs.length === 0) {
                    return (
                      <div className="py-8 text-center">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Chưa có lịch sử sửa chữa</p>
                              <p className="text-sm text-gray-400">Chưa có yêu cầu sửa chữa nào cho sản phẩm này</p>
                            </div>
                          }
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      {logs.map((log) => (
                        <Card
                          key={log.id}
                          className="mb-4 border-gray-200"
                          styles={{ body: { padding: '16px' } }}
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Thông tin cơ bản */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <Descriptions title="Thông tin yêu cầu" size="small" column={1} bordered>
                                <Descriptions.Item label="Trạng thái">
                                  <Tag color={getLogStatusColor(log.status)}>
                                    {getLogStatusText(log.status)}
                                  </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Mô tả vấn đề">
                                  {log.problemDescription || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Bảo hành">
                                  {log.covered === true ? (
                                    <Tag color="green">Có</Tag>
                                  ) : log.covered === false ? (
                                    <Tag color="red">Không</Tag>
                                  ) : (
                                    <Tag>Không chắc</Tag>
                                  )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                  {formatDate(log.createdAt)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cập nhật">
                                  {formatDate(log.updatedAt)}
                                </Descriptions.Item>
                              </Descriptions>
                            </div>

                            {/* Chẩn đoán & Giải pháp */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <Descriptions title="Chẩn đoán & Giải pháp" size="small" column={1} bordered>
                                <Descriptions.Item label="Chẩn đoán">
                                  {log.diagnosis || <Text type="secondary">Chưa có</Text>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Giải pháp">
                                  {log.resolution || <Text type="secondary">Chưa có</Text>}
                                </Descriptions.Item>
                                {log.shipBackTracking && (
                                  <Descriptions.Item label="Mã vận đơn">
                                    <Text code>{log.shipBackTracking}</Text>
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                            </div>

                            {/* Chi phí */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <Descriptions title="Chi phí" size="small" column={1} bordered>
                                <Descriptions.Item label="Nhân công">
                                  {log.costLabor ? formatCurrency(log.costLabor) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Linh kiện">
                                  {log.costParts ? formatCurrency(log.costParts) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng cộng">
                                  {log.costTotal ? (
                                    <Text strong className="text-orange-600">
                                      {formatCurrency(log.costTotal)}
                                    </Text>
                                  ) : (
                                    '-'
                                  )}
                                </Descriptions.Item>
                              </Descriptions>
                            </div>
                          </div>

                          {/* Hình ảnh đính kèm */}
                          {log.attachmentUrls && log.attachmentUrls.length > 0 && (
                            <>
                              <Divider className="my-4" />
                              <div>
                                <Text strong className="text-sm mb-2 block">Hình ảnh đính kèm ({log.attachmentUrls.length})</Text>
                                <div className="grid grid-cols-5 gap-2">
                                  {log.attachmentUrls.map((url, index) => (
                                    <Image
                                      key={index}
                                      src={url}
                                      alt={`Attachment ${index + 1}`}
                                      className="rounded-lg border border-gray-200"
                                      width={100}
                                      height={100}
                                      preview={{
                                        mask: 'Xem ảnh',
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </Card>
                      ))}
                    </div>
                  );
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <p className="text-gray-600 font-medium">Chưa có bảo hành nào</p>
                        <p className="text-sm text-gray-400 mt-1">Các sản phẩm từ đơn hàng đã giao hàng thành công sẽ tự động được bảo hành</p>
                      </div>
                    }
                  />
                ),
              }}
            />
          )}
        </Card>
      </div>

      {/* Request Repair Modal */}
      {selectedWarranty && (
        <RequestRepairModal
          warranty={selectedWarranty}
          onClose={() => setSelectedWarranty(null)}
          onSuccess={handleRepairSuccess}
        />
      )}
    </Layout>
  );
};

export default WarrantyPage;
