import React, { useState, useMemo, useCallback } from 'react';
import { Button, Card, Divider, List, Tag, Typography, Collapse, Space, Row, Col, Badge, Modal, Input, Form, Empty, Spin, Descriptions, Image, Select, InputNumber } from 'antd';
import type { CollapseProps } from 'antd';
import { Calendar, MapPin, Package, Phone, ShieldCheck, ChevronDown, Plus, FileText, Trash2 } from 'lucide-react';
import type { StoreOrder } from '../../types/seller';
import type { Warranty, WarrantyLog, WarrantyLogStatus, UpdateWarrantyLogRequest } from '../../types/api';
import { formatCurrency, getStatusLabel, formatDate } from '../../utils/orderStatus';
import { SellerWarrantyService } from '../../services/seller/WarrantyService';
import { showCenterSuccess, showCenterError } from '../../utils/notification';

const { TextArea } = Input;

interface WarrantyOrderCardProps {
  order: StoreOrder;
  warranties?: Warranty[]; // Array of warranties for this order (one per product)
  onActivate: (order: StoreOrder) => void;
  isActivating?: boolean;
  activatingOrderId?: string | null;
  onSerialAdded?: () => void; // Callback to refresh data after adding serial
}

interface WarrantyWithLogs extends Warranty {
  logs?: WarrantyLog[];
  logsLoading?: boolean;
  logsLoaded?: boolean;
}

const LOG_STATUS_LABELS: Record<WarrantyLogStatus, string> = {
  OPEN: 'Chờ xử lý',
  DIAGNOSING: 'Đang chẩn đoán',
  WAITING_PARTS: 'Chờ linh kiện',
  REPAIRING: 'Đang sửa chữa',
  READY_FOR_PICKUP: 'Sẵn sàng lấy hàng',
  SHIP_BACK: 'Đang trả hàng',
  COMPLETED: 'Đã hoàn tất',
  CLOSED: 'Đã đóng',
};

const LOG_STATUS_OPTIONS = (Object.keys(LOG_STATUS_LABELS) as WarrantyLogStatus[]).map(
  (key) => ({
    value: key,
    label: LOG_STATUS_LABELS[key],
  })
);

const formatThousands = (value?: string | number): string => {
  if (value === undefined || value === null) return '';
  const stringValue = typeof value === 'number' ? value.toString() : value.replace(/\s/g, '');
  return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const parseThousands = (value?: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, '');
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const WarrantyOrderCard: React.FC<WarrantyOrderCardProps> = ({ 
  order, 
  warranties = [],
  onActivate, 
  isActivating = false,
  activatingOrderId = null,
  onSerialAdded
}) => {
  const [form] = Form.useForm();
  const [editLogForm] = Form.useForm();
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [isSubmittingSerial, setIsSubmittingSerial] = useState(false);
  const [warrantiesWithLogs, setWarrantiesWithLogs] = useState<WarrantyWithLogs[]>(
    warranties.map(w => ({ ...w, logs: [], logsLoading: false, logsLoaded: false }))
  );
  const [expandedLogKeys, setExpandedLogKeys] = useState<string[]>([]);
  const [isEditLogModalOpen, setIsEditLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WarrantyLog | null>(null);
  const [isUpdatingLog, setIsUpdatingLog] = useState(false);

  // Update warrantiesWithLogs when warranties prop changes
  React.useEffect(() => {
    setWarrantiesWithLogs(prev => {
      return warranties.map(w => {
        const existing = prev.find(wl => wl.id === w.id);
        return existing ? { ...w, logs: existing.logs, logsLoading: existing.logsLoading, logsLoaded: existing.logsLoaded } : { ...w, logs: [], logsLoading: false, logsLoaded: false };
      });
    });
  }, [warranties]);

  // Load logs for a warranty
  const loadWarrantyLogs = useCallback(async (warrantyId: string) => {
    if (!warrantyId) {
      console.warn('⚠️ No warranty ID provided for loading logs');
      return;
    }

    console.log('🔍 Loading warranty logs for:', warrantyId);
    setWarrantiesWithLogs(prev =>
      prev.map(w => (w.id === warrantyId ? { ...w, logsLoading: true } : w))
    );

    try {
      const logs = await SellerWarrantyService.getWarrantyLogs(warrantyId);
      console.log('✅ Warranty logs loaded:', logs);
      console.log('📊 Logs array length:', logs.length);
      setWarrantiesWithLogs(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs, logsLoading: false, logsLoaded: true } : w))
      );
    } catch (err: any) {
      console.error('❌ Error loading warranty logs:', err);
      setWarrantiesWithLogs(prev =>
        prev.map(w => (w.id === warrantyId ? { ...w, logs: [], logsLoading: false, logsLoaded: true } : w))
      );
    }
  }, []);

  // Handle logs collapse change
  const handleLogsCollapseChange = useCallback((keys: string | string[]) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const prevKeys = expandedLogKeys;
    
    console.log('🔄 Handle logs collapse change:', { 
      keys: keyArray, 
      prevKeys, 
      warrantiesWithLogs: warrantiesWithLogs.map(w => ({ id: w.id, logsLoaded: w.logsLoaded, logsLoading: w.logsLoading }))
    });
    
    // Find newly expanded warranties
    const newlyExpanded = keyArray.filter(key => !prevKeys.includes(key));
    
    setExpandedLogKeys(keyArray);
    
    // Load logs for newly expanded warranties
    newlyExpanded.forEach(key => {
      const warranty = warrantiesWithLogs.find(w => w.id === key);
      console.log('🔍 Checking warranty for logs:', { key, warranty: warranty ? { id: warranty.id, logsLoaded: warranty.logsLoaded, logsLoading: warranty.logsLoading } : null });
      if (warranty && !warranty.logsLoaded && !warranty.logsLoading) {
        console.log('📥 Loading logs for warranty:', key);
        loadWarrantyLogs(key);
      }
    });
  }, [expandedLogKeys, warrantiesWithLogs, loadWarrantyLogs]);

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
    return LOG_STATUS_LABELS[status] || status;
  };

  const handleOpenEditLogModal = (log: WarrantyLog) => {
    setEditingLog(log);
    setIsEditLogModalOpen(true);
    editLogForm.setFieldsValue({
      status: log.status,
      diagnosis: log.diagnosis || '',
      resolution: log.resolution || '',
      shipBackTracking: log.shipBackTracking || '',
      attachmentUrls:
        log.attachmentUrls && log.attachmentUrls.length > 0
          ? [...log.attachmentUrls]
          : [''],
      costLabor: typeof log.costLabor === 'number' ? log.costLabor : null,
      costParts: typeof log.costParts === 'number' ? log.costParts : null,
    });
  };

  const handleCloseEditLogModal = () => {
    setIsEditLogModalOpen(false);
    setEditingLog(null);
    setIsUpdatingLog(false);
    editLogForm.resetFields();
  };

  const handleSubmitEditLog = async () => {
    if (!editingLog) {
      return;
    }

    try {
      const values = await editLogForm.validateFields();
      const attachmentInputs: string[] = values.attachmentUrls || [];
      const attachmentUrls = attachmentInputs
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter((url) => !!url);

      const payload: UpdateWarrantyLogRequest = {};

      if ('diagnosis' in values) {
        payload.diagnosis = values.diagnosis?.trim() || null;
      }
      if ('resolution' in values) {
        payload.resolution = values.resolution?.trim() || null;
      }
      if ('shipBackTracking' in values) {
        payload.shipBackTracking = values.shipBackTracking?.trim() || null;
      }
      if ('attachmentUrls' in values) {
        payload.attachmentUrls = attachmentUrls;
      }
      if ('costLabor' in values) {
        payload.costLabor =
          typeof values.costLabor === 'number' || values.costLabor === null
            ? values.costLabor
            : null;
      }
      if ('costParts' in values) {
        payload.costParts =
          typeof values.costParts === 'number' || values.costParts === null
            ? values.costParts
            : null;
      }

      setIsUpdatingLog(true);
      const targetWarrantyId = editingLog.warrantyId;
      await SellerWarrantyService.updateWarrantyLog(
        editingLog.id,
        values.status,
        payload
      );
      showCenterSuccess('Cập nhật bảo hành thành công', 'Thông tin log đã được lưu');
      handleCloseEditLogModal();
      loadWarrantyLogs(targetWarrantyId);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      showCenterError(error?.message || 'Không thể cập nhật log bảo hành', 'Lỗi');
    } finally {
      setIsUpdatingLog(false);
    }
  };

  const isThisOrderActivating = isActivating && activatingOrderId === order.id;
  // Only render if order status is DELIVERY_SUCCESS
  if (order.status !== 'DELIVERY_SUCCESS') {
    return null;
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusLabel = getStatusLabel(order.status);
  
  // Check warranty status for the order
  const hasWarranties = warranties.length > 0;
  const activatedWarranties = warranties.filter(w => w.id !== null && w.status === 'ACTIVE');
  const pendingWarranties = warranties.filter(w => w.id === null || w.status === 'PENDING_ACTIVATION');
  const isFullyActivated = hasWarranties && activatedWarranties.length === warranties.length && pendingWarranties.length === 0;
  const hasPendingWarranties = pendingWarranties.length > 0;

  // Create collapse items from warranties
  const collapseItems: CollapseProps['items'] = useMemo(() => {
    return warrantiesWithLogs.map((warranty, index) => {
      const isActivated = warranty.id !== null && warranty.status === 'ACTIVE';
      const isPending = warranty.id === null || warranty.status === 'PENDING_ACTIVATION';
      
      return {
        key: warranty.id || `pending-${index}`,
        label: (
          <div className="flex items-center justify-between w-full pr-4">
            <Space>
              <Package className="w-4 h-4 text-orange-500" />
              <Typography.Text strong className="text-sm">
                {warranty.productName}
              </Typography.Text>
            </Space>
            <Space>
              {isActivated && (
                <Tag color="green" className="text-xs">Còn hiệu lực</Tag>
              )}
              {isPending && (
                <Tag color="orange" className="text-xs">Chờ kích hoạt</Tag>
              )}
            </Space>
          </div>
        ),
        children: (
          <Row gutter={[16, 12]} className="mt-2">
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Mã bảo hành
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-gray-400" />
                  {warranty.id ? (
                    <Typography.Text code className="text-sm font-medium">
                      {warranty.id}
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary" className="text-sm italic">
                      Chưa có mã
                    </Typography.Text>
                  )}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Số serial
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-gray-400" />
                  {warranty.serialNumber ? (
                    <Typography.Text className="text-sm font-medium font-mono">
                      {warranty.serialNumber}
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary" className="text-sm italic">
                      Chưa có số serial
                    </Typography.Text>
                  )}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Trạng thái
                </Typography.Text>
                <div>
                  <Tag 
                    color={
                      warranty.status === 'ACTIVE' ? 'green' : 
                      warranty.status === 'PENDING_ACTIVATION' ? 'orange' : 
                      'default'
                    }
                    className="text-xs"
                  >
                    {warranty.status === 'ACTIVE' ? 'Còn hiệu lực' : 
                     warranty.status === 'PENDING_ACTIVATION' ? 'Chờ kích hoạt' : 
                     warranty.status}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Ngày bắt đầu
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <Typography.Text className="text-sm">
                    {warranty.startDate ? formatDate(warranty.startDate) : 'Chưa kích hoạt'}
                  </Typography.Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="space-y-1">
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Ngày hết hạn
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <Typography.Text className="text-sm">
                    {warranty.endDate ? formatDate(warranty.endDate) : 'Chưa kích hoạt'}
                  </Typography.Text>
                </div>
              </div>
            </Col>
            {warranty.policyCode && (
              <Col xs={24}>
                <div className="space-y-1 pt-2 border-t border-gray-200">
                  <Typography.Text type="secondary" className="text-xs block mb-1">
                    Mã chính sách
                  </Typography.Text>
                  <Typography.Text code className="text-sm font-medium">
                    {warranty.policyCode}
                  </Typography.Text>
                </div>
              </Col>
            )}
            {/* Add Serial Number Button */}
            {!warranty.serialNumber && warranty.id && (
              <Col xs={24}>
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<Plus className="w-3 h-3" />}
                    onClick={() => handleAddSerialClick(warranty)}
                    className="w-full"
                  >
                    Thêm số serial
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        ),
        className: `mb-2 ${
          isPending 
            ? 'bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100' 
            : 'bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100'
        } transition-colors`,
        style: {
          borderLeft: `4px solid ${isPending ? '#f97316' : '#1890ff'}`,
        },
      };
    });
  }, [warranties]);

  const handleAddSerialClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setIsSerialModalOpen(true);
    form.resetFields();
  };

  const handleSerialModalCancel = () => {
    setIsSerialModalOpen(false);
    setSelectedWarranty(null);
    form.resetFields();
  };

  const handleSerialSubmit = async (values: { serialNumber: string; note?: string }) => {
    if (!selectedWarranty || !selectedWarranty.id) {
      showCenterError('Không tìm thấy thông tin bảo hành', 'Lỗi');
      return;
    }

    try {
      setIsSubmittingSerial(true);
      await SellerWarrantyService.activateSerialNumber(
        selectedWarranty.id,
        values.serialNumber.trim(),
        values.note?.trim()
      );
      showCenterSuccess(
        'Thêm số serial thành công',
        `Số serial ${values.serialNumber} đã được thêm cho sản phẩm ${selectedWarranty.productName}`
      );
      handleSerialModalCancel();
      // Call callback to refresh data
      if (onSerialAdded) {
        onSerialAdded();
      }
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể thêm số serial', 'Lỗi');
    } finally {
      setIsSubmittingSerial(false);
    }
  };

  return (
    <Card
      className="border border-gray-200 hover:border-orange-400 transition-colors shadow-sm"
      styles={{ body: { padding: 24 } }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="flex-1 space-y-4">
          {/* Header with Order Status and Warranty Status */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Tag color="green" className="text-sm">{statusLabel}</Tag>
            {isFullyActivated && (
              <Tag color="blue" icon={<ShieldCheck className="w-3 h-3" />} className="text-sm">
                Đã kích hoạt bảo hành
              </Tag>
            )}
            {hasPendingWarranties && (
              <Tag 
                color="orange" 
                className="text-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span>Chờ kích hoạt bảo hành</span>
              </Tag>
            )}
            {hasWarranties && (
              <Badge 
                count={warranties.length} 
                showZero 
                style={{ backgroundColor: '#1890ff' }}
                title={`${warranties.length} sản phẩm có bảo hành`}
              >
                <Tag color="default" className="text-sm">
                  {warranties.length} bảo hành
                </Tag>
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
              <Calendar className="w-4 h-4" />
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          {/* Warranties Collapse Section */}
          {hasWarranties && warranties.length > 0 && (
            <div className="mb-4">
              <Typography.Text strong className="text-sm text-gray-700 mb-2 block">
                Thông tin bảo hành sản phẩm
              </Typography.Text>
              <Collapse
                ghost
                items={collapseItems}
                expandIcon={({ isActive }) => (
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} 
                  />
                )}
                className="warranty-collapse"
                style={{ 
                  background: 'transparent',
                }}
              />
            </div>
          )}

          {/* Warranty Logs Section - Separate from warranty info */}
          {hasWarranties && warrantiesWithLogs.some(w => w.id) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Typography.Text strong className="text-sm text-gray-700 mb-3 block">
                Lịch sử sửa chữa
              </Typography.Text>
              <div className="space-y-4">
                {warrantiesWithLogs
                  .filter(w => w.id) // Only show logs for activated warranties
                  .map((warranty) => {
                    const logItems: CollapseProps['items'] = [{
                      key: warranty.id!,
                      label: (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{warranty.productName}</span>
                          {warranty.logs && warranty.logs.length > 0 && (
                            <Tag color="blue">{warranty.logs.length} yêu cầu</Tag>
                          )}
                        </div>
                      ),
                      children: warranty.logsLoading ? (
                        <div className="py-8 text-center">
                          <Spin size="small" />
                          <p className="mt-2 text-sm text-gray-500">Đang tải lịch sử sửa chữa...</p>
                        </div>
                      ) : warranty.logs && warranty.logs.length > 0 ? (
                        <div className="space-y-4">
                          {warranty.logs.map((log) => (
                            <Card
                              key={log.id}
                              className="border-gray-200"
                              size="small"
                              styles={{ body: { padding: '16px' } }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div>
                                  <Typography.Text strong className="text-sm">
                                    Phiếu sửa chữa
                                  </Typography.Text>
                                  <Typography.Text type="secondary" className="block text-xs">
                                    #{log.id.slice(0, 8).toUpperCase()}
                                  </Typography.Text>
                                </div>
                                <Button
                                  size="small"
                                  type="primary"
                                  ghost
                                  onClick={() => handleOpenEditLogModal(log)}
                                >
                                  Chỉnh sửa bảo hành
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Thông tin cơ bản */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
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
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <Descriptions title="Chẩn đoán & Giải pháp" size="small" column={1} bordered>
                                    <Descriptions.Item label="Chẩn đoán">
                                      {log.diagnosis || <Typography.Text type="secondary">Chưa có</Typography.Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giải pháp">
                                      {log.resolution || <Typography.Text type="secondary">Chưa có</Typography.Text>}
                                    </Descriptions.Item>
                                    {log.shipBackTracking && (
                                      <Descriptions.Item label="Mã vận đơn">
                                        <Typography.Text code>{log.shipBackTracking}</Typography.Text>
                                      </Descriptions.Item>
                                    )}
                                  </Descriptions>
                                </div>

                                {/* Chi phí */}
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
                                        <Typography.Text strong className="text-orange-600">
                                          {formatCurrency(log.costTotal)}
                                        </Typography.Text>
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
                                  <Divider className="my-3" />
                                  <div>
                                    <Typography.Text strong className="text-sm mb-2 block">Hình ảnh đính kèm ({log.attachmentUrls.length})</Typography.Text>
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
                      ),
                    }];

                    return (
                      <Collapse
                        key={warranty.id}
                        activeKey={expandedLogKeys.includes(warranty.id!) ? [warranty.id!] : []}
                        onChange={handleLogsCollapseChange}
                        ghost
                        items={logItems}
                        expandIcon={({ isActive }) => (
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} 
                          />
                        )}
                        className="mb-2"
                      />
                    );
                  })}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Typography.Text className="text-sm font-semibold text-gray-700">
                Khách hàng
              </Typography.Text>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">{order.customerName}</div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {order.customerPhone || '—'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Typography.Text className="text-sm font-semibold text-gray-700">
                Địa chỉ giao hàng
              </Typography.Text>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>
                  {[order.shipStreet, order.shipWard, order.shipDistrict, order.shipProvince]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            </div>
          </div>

          <Divider className="my-2" />

          <div>
            <Typography.Text className="text-sm font-semibold text-gray-700">
              Sản phẩm ({totalItems})
            </Typography.Text>
            <List
              dataSource={order.items}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ padding: '8px 0' }}>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-gray-500">× {item.quantity}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có sản phẩm' }}
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:min-w-[220px]">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tổng tiền</span>
              <span className="font-semibold text-gray-900">{formatCurrency(order.grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
          </div>
          {!isFullyActivated ? (
            <Button
              type="primary"
              size="large"
              onClick={() => onActivate(order)}
              className="w-full"
              loading={isThisOrderActivating}
              disabled={isThisOrderActivating}
              icon={!isThisOrderActivating && <ShieldCheck className="w-4 h-4" />}
            >
              {isThisOrderActivating ? 'Đang kích hoạt...' : 'Kích hoạt bảo hành'}
            </Button>
          ) : (
            <Button
              type="default"
              size="large"
              className="w-full"
              disabled
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Đã kích hoạt bảo hành
            </Button>
          )}
        </div>
      </div>

      {/* Modal for editing warranty log */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Chỉnh sửa bảo hành</span>
          </div>
        }
        open={isEditLogModalOpen}
        onCancel={handleCloseEditLogModal}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <Form form={editLogForm} layout="vertical">
          <Form.Item
            label="Trạng thái xử lý"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái mới' }]}
          >
            <Select
              placeholder="Chọn trạng thái"
              options={LOG_STATUS_OPTIONS}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Chi phí nhân công" name="costLabor">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Nhập chi phí nhân công"
                  formatter={formatThousands}
                  parser={(value) => parseThousands(value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Chi phí linh kiện" name="costParts">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Nhập chi phí linh kiện"
                  formatter={formatThousands}
                  parser={(value) => parseThousands(value)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Chẩn đoán" name="diagnosis">
            <TextArea rows={3} placeholder="Mô tả chẩn đoán chi tiết" />
          </Form.Item>
          <Form.Item label="Giải pháp" name="resolution">
            <TextArea rows={3} placeholder="Mô tả giải pháp xử lý" />
          </Form.Item>
          <Form.Item label="Mã vận đơn trả hàng" name="shipBackTracking">
            <Input placeholder="VD: GHN123456789" />
          </Form.Item>

          <Form.List name="attachmentUrls">
            {(fields, { add, remove }) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Typography.Text className="text-sm font-medium text-gray-700">
                    Link hình ảnh/biên bản
                  </Typography.Text>
                  <Button
                    type="dashed"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => add()}
                  >
                    Thêm đường dẫn
                  </Button>
                </div>
                {fields.length === 0 && (
                  <Typography.Text type="secondary" className="text-xs">
                    Chưa có đường dẫn nào. Nhấn "Thêm đường dẫn" để bổ sung.
                  </Typography.Text>
                )}
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" className="w-full">
                    <Form.Item
                      {...field}
                      className="flex-1"
                      rules={[
                        {
                          type: 'url',
                          message: 'Đường dẫn không hợp lệ',
                        },
                      ]}
                    >
                      <Input placeholder={`Link #${index + 1}`} />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<Trash2 className="w-4 h-4 text-red-500" />}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                ))}
              </div>
            )}
          </Form.List>

          <Divider className="my-4" />
          <Space className="w-full justify-end">
            <Button onClick={handleCloseEditLogModal} disabled={isUpdatingLog}>
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSubmitEditLog}
              loading={isUpdatingLog}
            >
              Lưu thay đổi
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Modal for adding serial number */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span>Thêm số serial cho sản phẩm</span>
          </div>
        }
        open={isSerialModalOpen}
        onCancel={handleSerialModalCancel}
        footer={null}
        width={520}
      >
        {selectedWarranty && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Typography.Text type="secondary" className="text-xs block mb-1">
                Sản phẩm
              </Typography.Text>
              <Typography.Text strong className="text-sm">
                {selectedWarranty.productName}
              </Typography.Text>
              {selectedWarranty.id && (
                <div className="mt-2">
                  <Typography.Text type="secondary" className="text-xs block mb-1">
                    Mã bảo hành
                  </Typography.Text>
                  <Typography.Text code className="text-xs">
                    {selectedWarranty.id}
                  </Typography.Text>
                </div>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSerialSubmit}
              autoComplete="off"
            >
              <Form.Item
                label={<span className="text-sm font-medium">Số serial <span className="text-red-500">*</span></span>}
                name="serialNumber"
                rules={[
                  { required: true, message: 'Vui lòng nhập số serial' },
                  { whitespace: true, message: 'Số serial không được để trống' },
                ]}
              >
                <Input
                  placeholder="Nhập số serial của sản phẩm"
                  size="large"
                  className="font-mono"
                  maxLength={100}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium">Ghi chú (tùy chọn)</span>}
                name="note"
              >
                <TextArea
                  placeholder="Nhập ghi chú (nếu có)"
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={handleSerialModalCancel}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmittingSerial}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {isSubmittingSerial ? 'Đang thêm...' : 'Thêm số serial'}
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

export default WarrantyOrderCard;


