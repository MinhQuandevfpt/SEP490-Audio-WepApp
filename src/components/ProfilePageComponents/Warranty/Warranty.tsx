import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Empty, Spin, Typography, Button, Pagination, Tag, Space, Row, Col, Input, Modal, Form, Upload, Radio, Descriptions, Divider, Image } from 'antd';
import { SearchOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { Shield, Wrench, Calendar, Store, Package, FileText } from 'lucide-react';
import { WarrantyService } from '../../../services/customer/WarrantyService';
import { FileUploadService } from '../../../services/FileUploadService';
import type { Warranty, WarrantyLog, WarrantyLogStatus } from '../../../types/api';
import { formatDate, formatCurrency } from '../../../utils/orderStatus';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const { Text, Title } = Typography;
const { Search, TextArea } = Input;

interface WarrantyWithLogs extends Warranty {
  logs?: WarrantyLog[];
  logsLoading?: boolean;
  logsLoaded?: boolean;
}

const WarrantyComponent: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Repair Modal State
  const [repairModalVisible, setRepairModalVisible] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [form] = Form.useForm();
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Expanded warranty IDs for logs
const [logsModalVisible, setLogsModalVisible] = useState(false);
const [logsModalWarrantyId, setLogsModalWarrantyId] = useState<string | null>(null);

  // Load warranties
  const loadWarranties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await WarrantyService.getWarrantiesByEmail();
      setWarranties(data.map(w => ({ ...w, logs: [], logsLoading: false, logsLoaded: false })));
      setCurrentPage(1); // Reset to first page when data loads
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bảo hành');
      setWarranties([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs for a warranty
  const loadWarrantyLogs = useCallback(async (warrantyId: string) => {
    if (!warrantyId) return;

    // Update loading state
    setWarranties(prev =>
      prev.map(w => (w.id === warrantyId ? { ...w, logsLoading: true } : w))
    );

    try {
      const logs = await WarrantyService.getWarrantyLogs(warrantyId);
      setWarranties(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs, logsLoading: false, logsLoaded: true } : w))
      );
    } catch (err: any) {
      console.error('Error loading warranty logs:', err);
      setWarranties(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs: [], logsLoading: false, logsLoaded: true } : w))
      );
    }
  }, []);

const logsModalWarranty = useMemo(
  () => (logsModalWarrantyId ? warranties.find((w) => w.id === logsModalWarrantyId) || null : null),
  [logsModalWarrantyId, warranties]
);

const handleOpenLogsModal = (warranty: WarrantyWithLogs) => {
  if (!warranty.id) return;
  setLogsModalVisible(true);
  setLogsModalWarrantyId(warranty.id);
  if (!warranty.logsLoaded && !warranty.logsLoading) {
    loadWarrantyLogs(warranty.id);
  }
};

const handleCloseLogsModal = () => {
  setLogsModalVisible(false);
  setLogsModalWarrantyId(null);
};

  // Check if warranty has active repair request
  const hasActiveRepair = (warranty: WarrantyWithLogs): boolean => {
    if (!warranty.logs || warranty.logs.length === 0) return false;
    return warranty.logs.some(
      log => log.status !== 'COMPLETED' && log.status !== 'CLOSED'
    );
  };

  useEffect(() => {
    loadWarranties();
  }, []);

  // Filter warranties by search term
  const filteredWarranties = useMemo(() => {
    if (!searchTerm.trim()) {
      return warranties;
    }
    const term = searchTerm.toLowerCase();
    return warranties.filter(
      (w) =>
        w.productName.toLowerCase().includes(term) ||
        w.storeName.toLowerCase().includes(term) ||
        (w.serialNumber && w.serialNumber.toLowerCase().includes(term)) ||
        (w.policyCode && w.policyCode.toLowerCase().includes(term))
    );
  }, [warranties, searchTerm]);

  // Paginate filtered warranties
  const paginatedWarranties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredWarranties.slice(start, end);
  }, [filteredWarranties, currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  const handleRepair = (warranty: Warranty) => {
    if (!warranty.id) {
      showCenterError('Bảo hành chưa được kích hoạt', 'Không thể yêu cầu sửa chữa');
      return;
    }
    setSelectedWarranty(warranty);
    setRepairModalVisible(true);
    form.resetFields();
    setUploadingFiles([]);
  };

  const handleRepairModalCancel = () => {
    // Cleanup preview URLs
    uploadingFiles.forEach((file) => {
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    });
    
    setRepairModalVisible(false);
    setSelectedWarranty(null);
    form.resetFields();
    setUploadingFiles([]);
  };

  const handleRepairSubmit = async (values: {
    problemDescription: string;
    covered: boolean | null;
  }) => {
    if (!selectedWarranty?.id) return;

    try {
      setSubmitting(true);

      // Upload files first
      let attachmentUrls: string[] = [];
      if (uploadingFiles.length > 0) {
        setUploading(true);
        const files = uploadingFiles
          .filter((file) => file.originFileObj)
          .map((file) => file.originFileObj as File);
        
        if (files.length > 0) {
          const uploadResults = await FileUploadService.uploadMultipleImages(files);
          attachmentUrls = uploadResults.map((result) => result.url);
        }
        
        // Cleanup preview URLs after upload
        uploadingFiles.forEach((file) => {
          if (file.url && file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url);
          }
        });
        
        setUploading(false);
      }

      // Call API
      await WarrantyService.requestRepair(selectedWarranty.id, {
        problemDescription: values.problemDescription,
        covered: values.covered,
        attachmentUrls,
      });

      showCenterSuccess(
        `Yêu cầu sửa chữa cho sản phẩm "${selectedWarranty.productName}" đã được gửi`,
        'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất'
      );

      // Reload logs for the warranty
      if (selectedWarranty.id) {
        await loadWarrantyLogs(selectedWarranty.id);
      }

      handleRepairModalCancel();
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể gửi yêu cầu sửa chữa', 'Lỗi');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleUploadChange = (info: any) => {
    let fileList = [...info.fileList];
    
    // Limit to 5 files
    fileList = fileList.slice(-5);
    
    // Create preview URLs for local files
    fileList = fileList.map((file) => {
      if (file.originFileObj && !file.url) {
        // Create preview URL for local file
        file.url = URL.createObjectURL(file.originFileObj);
        file.preview = file.url;
      }
      return file;
    });

    setUploadingFiles(fileList);
  };

  const beforeUpload = (file: File) => {
    const validation = FileUploadService.validateFile(file);
    if (!validation.isValid) {
      showCenterError(validation.error || 'File không hợp lệ', 'Lỗi');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const getStatusTag = (warranty: Warranty) => {
    if (!warranty.stillValid) {
      return <Tag color="red">Hết hạn</Tag>;
    }
    if (warranty.status === 'ACTIVE') {
      return <Tag color="green">Còn hiệu lực</Tag>;
    }
    if (warranty.status === 'EXPIRED') {
      return <Tag color="red">Đã hết hạn</Tag>;
    }
    if (warranty.status === 'PENDING_ACTIVATION') {
      return <Tag color="orange">Chờ kích hoạt</Tag>;
    }
    if (warranty.status === 'VOID') {
      return <Tag color="default">Đã hủy</Tag>;
    }
    if (warranty.status === 'TRANSFERRED') {
      return <Tag color="blue">Đã chuyển nhượng</Tag>;
    }
    return <Tag>{warranty.status}</Tag>;
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

  return (
    <Card
      title={
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Title level={4} className="!mb-1 !text-gray-900">Bảo hành sản phẩm</Title>
            <Text type="secondary" className="text-sm">Quản lý và yêu cầu sửa chữa cho các sản phẩm đã mua</Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadWarranties}
            loading={isLoading}
          >
            Làm mới
          </Button>
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
          <div className="mt-4">
            <Button onClick={loadWarranties} type="primary">
              Thử lại
            </Button>
          </div>
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
        <div className="space-y-6">
          {/* Search */}
          <Search
            placeholder="Tìm kiếm theo tên sản phẩm, cửa hàng, số seri..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onSearch={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />

          {/* Warranty List */}
          {filteredWarranties.length === 0 ? (
            <Empty
              description={
                <div>
                  <p className="text-gray-600 font-medium mb-1">Không tìm thấy bảo hành nào</p>
                  <p className="text-sm text-gray-400">Thử tìm kiếm với từ khóa khác</p>
                </div>
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {paginatedWarranties.map((warranty, index) => (
                  <Card
                    key={warranty.id || `warranty-${index}`}
                    className="border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
                    styles={{ body: { padding: '24px' } }}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-8 h-8 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Title level={5} className="!mb-0 !text-gray-900">
                                {warranty.productName}
                              </Title>
                              {getStatusTag(warranty)}
                            </div>
                            <Space className="mb-2">
                              <Store className="w-4 h-4 text-gray-400" />
                              <Text type="secondary">{warranty.storeName}</Text>
                            </Space>
                            {warranty.serialNumber && (
                              <Space className="mb-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <Text type="secondary">Số seri: </Text>
                                <Text className="font-mono font-medium">{warranty.serialNumber}</Text>
                              </Space>
                            )}
                            {warranty.policyCode && (
                              <div>
                                <Text type="secondary" className="text-xs">Mã chính sách: </Text>
                                <Text className="text-sm font-medium">{warranty.policyCode}</Text>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Warranty Details Grid */}
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <Text type="secondary" className="text-xs block mb-1">Ngày mua</Text>
                              <Space>
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <Text className="text-sm font-medium">{formatDate(warranty.purchaseDate)}</Text>
                              </Space>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <Text type="secondary" className="text-xs block mb-1">Bắt đầu</Text>
                              <Space>
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <Text className="text-sm font-medium">
                                  {warranty.startDate ? formatDate(warranty.startDate) : 'Chưa kích hoạt'}
                                </Text>
                              </Space>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <Text type="secondary" className="text-xs block mb-1">Kết thúc</Text>
                              <Space>
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <Text className="text-sm font-medium">
                                  {warranty.endDate ? formatDate(warranty.endDate) : 'Chưa kích hoạt'}
                                </Text>
                              </Space>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <Text type="secondary" className="text-xs block mb-1">Thời hạn</Text>
                              <Text className="text-sm font-medium block">
                                {warranty.durationMonths} tháng
                              </Text>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      {/* Right: Action Button */}
                      <div className="flex flex-col justify-start">
                        {warranty.stillValid && warranty.status === 'ACTIVE' && warranty.id ? (
                          <Button
                            type="primary"
                            size="large"
                            icon={<Wrench className="w-4 h-4" />}
                            onClick={() => handleRepair(warranty)}
                            disabled={hasActiveRepair(warranty)}
                            style={{
                              backgroundColor: hasActiveRepair(warranty) ? undefined : '#f97316',
                              borderColor: hasActiveRepair(warranty) ? undefined : '#f97316',
                              borderRadius: '8px',
                              minWidth: '140px',
                            }}
                            title={hasActiveRepair(warranty) ? 'Đang có yêu cầu sửa chữa đang xử lý' : 'Yêu cầu sửa chữa'}
                          >
                            Sửa chữa
                          </Button>
                        ) : (
                          <Button
                            disabled
                            size="large"
                            style={{
                              borderRadius: '8px',
                              minWidth: '140px',
                            }}
                          >
                            {warranty.status === 'PENDING_ACTIVATION'
                              ? 'Chờ kích hoạt'
                              : 'Hết hạn bảo hành'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Warranty Logs Section */}
                    {warranty.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <div>
                            <span className="font-medium text-gray-800">Lịch sử sửa chữa</span>
                            {warranty.logs && warranty.logs.length > 0 && (
                              <Tag color="blue" className="ml-2">{warranty.logs.length} yêu cầu</Tag>
                            )}
                            {!warranty.logsLoaded && warranty.logsLoading && (
                              <Tag color="orange" className="ml-2">Đang tải...</Tag>
                            )}
                          </div>
                        </div>
                        <Space>
                          <Text type="secondary" className="text-sm hidden md:block">
                            Xem chi tiết lịch sử sửa chữa ở cửa sổ riêng.
                          </Text>
                          <Button
                            icon={<FileText className="w-4 h-4" />}
                            onClick={() => handleOpenLogsModal(warranty)}
                          >
                            Xem lịch sử sửa chữa
                          </Button>
                        </Space>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {filteredWarranties.length > pageSize && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredWarranties.length}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} của ${total} bảo hành`
                    }
                    pageSizeOptions={['6', '12', '24', '48']}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    style={{ textAlign: 'center' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Warranty Logs Modal */}
      <Modal
        open={logsModalVisible}
        onCancel={handleCloseLogsModal}
        footer={null}
        width={960}
        centered
        destroyOnHidden
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Lịch sử sửa chữa</span>
          </div>
        }
      >
        {logsModalWarranty ? (
          logsModalWarranty.logsLoading ? (
            <div className="py-12 text-center">
              <Spin />
              <p className="mt-2 text-gray-500">Đang tải lịch sử sửa chữa...</p>
            </div>
          ) : logsModalWarranty.logs && logsModalWarranty.logs.length > 0 ? (
            <div className="space-y-4">
              {logsModalWarranty.logs.map((log) => (
                <Card
                  key={log.id}
                  className="border border-gray-200"
                  size="small"
                  styles={{ body: { padding: '16px' } }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <Text strong className="text-base">{logsModalWarranty.productName}</Text>
                      <p className="text-xs text-gray-500 mt-1">
                        Mã bảo hành: <Text code>{logsModalWarranty.id}</Text>
                      </p>
                    </div>
                    <Tag color={getLogStatusColor(log.status)}>{getLogStatusText(log.status)}</Tag>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <Descriptions title="Thông tin yêu cầu" size="small" column={1} bordered>
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
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
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
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
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
                  {log.attachmentUrls && log.attachmentUrls.length > 0 && (
                    <>
                      <Divider className="my-3" />
                      <div>
                        <Text strong className="text-sm mb-2 block">
                          Hình ảnh đính kèm ({log.attachmentUrls.length})
                        </Text>
                        <div className="grid grid-cols-5 gap-2">
                          {log.attachmentUrls.map((url, index) => (
                            <Image
                              key={index}
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="rounded-lg border border-gray-200"
                              width={80}
                              height={80}
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
          ) : (
            <div className="py-12 text-center">
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
          )
        ) : (
          <div className="py-12 text-center text-gray-500">
            Vui lòng chọn một bảo hành để xem lịch sử sửa chữa.
          </div>
        )}
      </Modal>

      {/* Repair Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            <span>Yêu cầu sửa chữa</span>
          </div>
        }
        open={repairModalVisible}
        onCancel={handleRepairModalCancel}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {selectedWarranty && (
          <div className="space-y-4">
            {/* Warranty Info */}
            <Card size="small" className="bg-gray-50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-orange-600 mt-1" />
                <div className="flex-1">
                  <Text strong className="text-base">{selectedWarranty.productName}</Text>
                  <div className="mt-1">
                    <Text type="secondary" className="text-sm">{selectedWarranty.storeName}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRepairSubmit}
              initialValues={{
                covered: null,
              }}
            >
              <Form.Item
                label={
                  <span>
                    Mô tả lỗi/tình trạng <span className="text-red-500">*</span>
                  </span>
                }
                name="problemDescription"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả lỗi' },
                  { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
                ]}
              >
                <TextArea
                  placeholder="Mô tả chi tiết lỗi hoặc tình trạng hư hỏng của sản phẩm..."
                  rows={4}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label="Chính sách bảo hành"
                name="covered"
                tooltip="null = theo policy, true = miễn phí, false = thu phí"
              >
                <Radio.Group>
                  <Radio value={null}>Theo chính sách</Radio>
                  <Radio value={true}>Miễn phí</Radio>
                  <Radio value={false}>Thu phí</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Hình ảnh đính kèm (tối đa 5 ảnh)"
                name="attachments"
              >
                <Upload
                  listType="picture-card"
                  fileList={uploadingFiles}
                  onChange={handleUploadChange}
                  beforeUpload={beforeUpload}
                  maxCount={5}
                  accept="image/*"
                  customRequest={({ onSuccess }) => {
                    // Don't upload immediately, just mark as success
                    // We'll upload when form is submitted
                    setTimeout(() => {
                      onSuccess?.('ok');
                    }, 0);
                  }}
                  onRemove={(file) => {
                    // Cleanup preview URL
                    if (file.url && file.url.startsWith('blob:')) {
                      URL.revokeObjectURL(file.url);
                    }
                    const index = uploadingFiles.indexOf(file);
                    const newFileList = uploadingFiles.slice();
                    newFileList.splice(index, 1);
                    setUploadingFiles(newFileList);
                  }}
                  onPreview={(file) => {
                    if (file.originFileObj) {
                      const url = URL.createObjectURL(file.originFileObj);
                      window.open(url, '_blank');
                    } else if (file.url) {
                      window.open(file.url, '_blank');
                    }
                  }}
                >
                  {uploadingFiles.length < 5 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Tải lên</div>
                    </div>
                  )}
                </Upload>
                <Text type="secondary" className="text-xs block mt-2">
                  Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 10MB/ảnh)
                </Text>
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={handleRepairModalCancel} disabled={submitting || uploading}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting || uploading}
                    disabled={uploading}
                    style={{
                      backgroundColor: '#f97316',
                      borderColor: '#f97316',
                    }}
                  >
                    {uploading ? 'Đang tải ảnh...' : submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default WarrantyComponent;

