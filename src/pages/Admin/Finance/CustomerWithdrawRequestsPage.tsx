import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Select,
  Descriptions,
  Image,
  Alert,
  Spin,
  Empty,
  DatePicker,
  Upload,
  Row,
  Col
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  CopyOutlined,
  CheckOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { WithdrawRequest, WithdrawRequestStatus } from '../../../types/api';
import { useAdminWithdrawRequests } from '../../../hooks/useAdminWithdrawRequests';
import { AdminWalletService } from '../../../services/admin/AdminWalletService';
import { formatCurrency } from '../../../utils/orderStatus';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CustomerWithdrawRequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<WithdrawRequestStatus | undefined>(undefined);
  const [_dateRange, setDateRange] = useState<[string, string] | null>(null);
  const { 
    withdrawRequests, 
    loading, 
    error, 
    page, 
    pageSize, 
    total, 
    setPage, 
    setPageSize, 
    reload 
  } = useAdminWithdrawRequests(statusFilter);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  
  // Store customer info cache to avoid refetching
  const [customerInfoCache, setCustomerInfoCache] = useState<Record<string, any>>({});

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [paidForm] = Form.useForm();

  // Fetch customer info for all requests when data changes
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      const uniqueCustomerIds = [...new Set(withdrawRequests.map(req => req.customerId))];
      
      for (const customerId of uniqueCustomerIds) {
        if (!customerInfoCache[customerId]) {
          try {
            const customer = await AdminWalletService.getCustomerInfo(customerId);
            setCustomerInfoCache(prev => ({ ...prev, [customerId]: customer }));
          } catch (err) {
            console.error(`Failed to fetch customer info for ${customerId}:`, err);
          }
        }
      }
    };

    if (withdrawRequests.length > 0) {
      fetchCustomerInfo();
    }
  }, [withdrawRequests, customerInfoCache]);

  // Handle view detail
  const handleViewDetail = async (requestId: string) => {
    setDetailLoading(true);
    setIsDetailModalOpen(true);
    
    try {
      const detail = await AdminWalletService.getWithdrawRequestDetail(requestId);
      setSelectedRequest(detail);
      
      // Fetch customer info if not in cache
      if (detail.customerId) {
        if (customerInfoCache[detail.customerId]) {
          setCustomerInfo(customerInfoCache[detail.customerId]);
        } else {
          try {
            const customer = await AdminWalletService.getCustomerInfo(detail.customerId);
            setCustomerInfo(customer);
            setCustomerInfoCache(prev => ({ ...prev, [detail.customerId]: customer }));
          } catch (err) {
            console.error('Failed to fetch customer info:', err);
            setCustomerInfo(null);
          }
        }
      }
    } catch (error: any) {
      console.error('Get detail error:', error);
      message.error(error?.message || 'Không thể tải chi tiết yêu cầu');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
    setCustomerInfo(null);
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`Đã copy ${label}`);
    }).catch(() => {
      message.error('Không thể copy');
    });
  };

  // Handle approve
  const handleOpenApproveModal = (request: WithdrawRequest) => {
    if (request.status !== 'PENDING') {
      message.warning('Chỉ có thể duyệt yêu cầu đang chờ xử lý');
      return;
    }
    setSelectedRequest(request);
    approveForm.resetFields();
    setIsApproveModalOpen(true);
  };

  const handleApprove = async (values: { note?: string }) => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await AdminWalletService.approveWithdrawRequest(selectedRequest.id, {
        note: values.note || undefined,
      });
      message.success('Đã duyệt yêu cầu rút tiền thành công!');
      setIsApproveModalOpen(false);
      approveForm.resetFields();
      setSelectedRequest(null);
      reload();
    } catch (error: any) {
      console.error('Approve error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleOpenRejectModal = (request: WithdrawRequest) => {
    if (request.status !== 'PENDING') {
      message.warning('Chỉ có thể từ chối yêu cầu đang chờ xử lý');
      return;
    }
    setSelectedRequest(request);
    rejectForm.resetFields();
    setIsRejectModalOpen(true);
  };

  const handleReject = async (values: { note: string }) => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await AdminWalletService.rejectWithdrawRequest(selectedRequest.id, {
        note: values.note,
      });
      message.success('Đã từ chối yêu cầu rút tiền!');
      setIsRejectModalOpen(false);
      rejectForm.resetFields();
      setSelectedRequest(null);
      reload();
    } catch (error: any) {
      console.error('Reject error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle mark as paid
  const handleOpenPaidModal = (request: WithdrawRequest) => {
    if (request.status !== 'APPROVED') {
      message.warning('Chỉ có thể xác nhận thanh toán cho yêu cầu đã duyệt');
      return;
    }
    setSelectedRequest(request);
    setUploadedImageUrls([]);
    paidForm.resetFields();
    setIsPaidModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      const imageUrl = await AdminWalletService.uploadImage(file);
      setUploadedImageUrls(prev => [...prev, imageUrl]);
      message.success('Upload ảnh thành công!');
      return false; // Prevent default upload behavior
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi upload ảnh');
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setUploadedImageUrls(prev => prev.filter(url => url !== imageUrl));
  };

  const handleMarkAsPaid = async (values: { payoutRef?: string; note?: string }) => {
    if (!selectedRequest) return;

    if (uploadedImageUrls.length === 0) {
      message.error('Vui lòng upload ít nhất 1 ảnh chứng minh');
      return;
    }

    setActionLoading(true);
    try {
      await AdminWalletService.markAsPaid(selectedRequest.id, {
        payoutRef: values.payoutRef,
        note: values.note,
        proofUrls: uploadedImageUrls,
      });
      message.success('Đã xác nhận thanh toán thành công!');
      setIsPaidModalOpen(false);
      paidForm.resetFields();
      setUploadedImageUrls([]);
      setSelectedRequest(null);
      reload();
    } catch (error: any) {
      console.error('Mark as paid error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnsType<WithdrawRequest> = [
    {
      title: 'Thông tin khách hàng',
      dataIndex: 'customerId',
      key: 'customerInfo',
      width: 220,
      render: (customerId: string) => {
        const cachedInfo = customerInfoCache[customerId];
        
        if (cachedInfo) {
          return (
            <div>
              <div className="font-medium">{cachedInfo.fullName || 'N/A'}</div>
              <div className="text-xs text-gray-500">{cachedInfo.email || 'N/A'}</div>
              <div className="text-xs text-gray-500">{cachedInfo.phoneNumber || 'N/A'}</div>
            </div>
          );
        }
        
        return (
          <div className="text-xs text-gray-400">
            <Spin size="small" /> Đang tải...
          </div>
        );
      },
    },
    {
      title: 'Thời gian yêu cầu',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (value: number) => (
        <span className="font-semibold text-red-500">{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 200,
      render: (value, record: WithdrawRequest) => (
        <div>
          <div className="font-medium">{record.bankCode}</div>
          <div className="text-xs text-gray-500 truncate">{value}</div>
        </div>
      ),
    },
    {
      title: 'Tài khoản',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 180,
      render: (value, record: WithdrawRequest) => (
        <div>
          <div className="font-mono">{value}</div>
          <div className="text-xs text-gray-500">{record.accountName}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'orange', text: 'Chờ xử lý' },
          APPROVED: { color: 'blue', text: 'Đã duyệt' },
          REJECTED: { color: 'red', text: 'Từ chối' },
          PAID: { color: 'green', text: 'Đã thanh toán' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record: WithdrawRequest) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
            block
          >
            Chi tiết
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button 
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApproveModal(record)}
                block
              >
                Duyệt
              </Button>
              <Button 
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenRejectModal(record)}
                block
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button 
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleOpenPaidModal(record)}
              block
              style={{ backgroundColor: '#52c41a' }}
            >
              Đã thanh toán
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý yêu cầu rút tiền khách hàng
        </h1>
        <p className="text-gray-600 mt-1">
          Xem và xử lý các yêu cầu rút tiền từ ví khách hàng
        </p>
      </div>

      {/* Filters Section - Outside Card */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { label: 'Tất cả trạng thái', value: undefined },
                { label: 'Chờ xử lý', value: 'PENDING' },
                { label: 'Đã duyệt', value: 'APPROVED' },
                { label: 'Từ chối', value: 'REJECTED' },
                { label: 'Đã thanh toán', value: 'PAID' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={10} lg={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([
                    dates[0].startOf('day').toISOString(),
                    dates[1].endOf('day').toISOString()
                  ]);
                } else {
                  setDateRange(null);
                }
                setPage(1);
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={reload}
              loading={loading}
              block
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table Card */}
      <Card>
        {error ? (
          <Alert type="error" message={error} showIcon />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={withdrawRequests}
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps || pageSize);
              },
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} yêu cầu`,
            }}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu rút tiền"
        open={isDetailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailModal}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
          </div>
        ) : selectedRequest ? (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã yêu cầu" span={2}>
                <Space>
                  <span className="font-mono text-xs">{selectedRequest.id}</span>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(selectedRequest.id, 'Mã yêu cầu')}
                  />
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Customer ID" span={2}>
                <Space>
                  <span className="font-mono text-xs">{selectedRequest.customerId}</span>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(selectedRequest.customerId, 'Customer ID')}
                  />
                </Space>
              </Descriptions.Item>
              
              {customerInfo && (
                <>
                  <Descriptions.Item label="Tên khách hàng" span={2}>
                    <span className="font-medium">{customerInfo.fullName || 'N/A'}</span>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Email">
                    {customerInfo.email || 'N/A'}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Số điện thoại">
                    {customerInfo.phoneNumber || 'N/A'}
                  </Descriptions.Item>
                </>
              )}
              
              <Descriptions.Item label="Thời gian tạo">
                {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(selectedRequest.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Số tiền rút" span={2}>
                <span className="text-lg font-bold text-red-500">
                  {formatCurrency(selectedRequest.amount)}
                </span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Trạng thái" span={2}>
                {(() => {
                  const statusConfig: Record<string, { color: string; text: string }> = {
                    PENDING: { color: 'orange', text: 'Chờ xử lý' },
                    APPROVED: { color: 'blue', text: 'Đã duyệt' },
                    REJECTED: { color: 'red', text: 'Từ chối' },
                    PAID: { color: 'green', text: 'Đã thanh toán' },
                  };
                  const config = statusConfig[selectedRequest.status] || { 
                    color: 'default', 
                    text: selectedRequest.status 
                  };
                  return <Tag color={config.color} className="text-base px-3 py-1">{config.text}</Tag>;
                })()}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngân hàng" span={2}>
                <div>
                  <div className="font-medium">{selectedRequest.bankName}</div>
                  <div className="text-xs text-gray-500">Mã: {selectedRequest.bankCode}</div>
                </div>
              </Descriptions.Item>
              
              <Descriptions.Item label="Số tài khoản">
                <span className="font-mono">{selectedRequest.accountNumber}</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Tên chủ tài khoản">
                <span className="font-medium">{selectedRequest.accountName}</span>
              </Descriptions.Item>
              
              {selectedRequest.adminNote && (
                <Descriptions.Item label="Ghi chú từ Admin" span={2}>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.adminNote}</p>
                  </div>
                </Descriptions.Item>
              )}
              
              {selectedRequest.payoutRef && (
                <Descriptions.Item label="Mã thanh toán (Payout Ref)" span={2}>
                  <span className="font-mono bg-green-50 px-2 py-1 rounded">
                    {selectedRequest.payoutRef}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedRequest.proofUrls && selectedRequest.proofUrls.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Ảnh chứng minh thanh toán:</h4>
                <Image.PreviewGroup>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRequest.proofUrls.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Proof ${index + 1}`}
                        className="rounded border"
                        width="100%"
                        height={120}
                        style={{ objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}
          </div>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Duyệt yêu cầu rút tiền"
        open={isApproveModalOpen}
        onCancel={() => {
          setIsApproveModalOpen(false);
          approveForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedRequest && (
          <>
            <Alert
              message="Xác nhận duyệt yêu cầu"
              description={
                <div className="space-y-2">
                  <p>Bạn đang duyệt yêu cầu rút tiền:</p>
                  <p><strong>Số tiền:</strong> {formatCurrency(selectedRequest.amount)}</p>
                  <p><strong>Ngân hàng:</strong> {selectedRequest.bankName}</p>
                  <p><strong>Tài khoản:</strong> {selectedRequest.accountNumber} - {selectedRequest.accountName}</p>
                  <p className="text-orange-600 mt-2">
                    ⚠️ Sau khi duyệt, trạng thái sẽ chuyển sang APPROVED. Hãy đảm bảo đã kiểm tra kỹ thông tin.
                  </p>
                </div>
              }
              type="info"
              showIcon
              className="mb-4"
            />
            <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
              <Form.Item
                label="Ghi chú (không bắt buộc)"
                name="note"
              >
                <TextArea
                  rows={4}
                  placeholder="Nhập ghi chú nếu cần..."
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setIsApproveModalOpen(false);
                    approveForm.resetFields();
                  }}>
                    Hủy
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={actionLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Xác nhận duyệt
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối yêu cầu rút tiền"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedRequest && (
          <>
            <Alert
              message="Xác nhận từ chối yêu cầu"
              description={
                <div className="space-y-2">
                  <p>Bạn đang từ chối yêu cầu rút tiền:</p>
                  <p><strong>Số tiền:</strong> {formatCurrency(selectedRequest.amount)}</p>
                  <p><strong>Khách hàng:</strong> {selectedRequest.accountName}</p>
                  <p className="text-red-600 mt-2">
                    ⚠️ Sau khi từ chối, hệ thống sẽ hoàn tiền về ví khách hàng.
                  </p>
                </div>
              }
              type="warning"
              showIcon
              className="mb-4"
            />
            <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
              <Form.Item
                label="Lý do từ chối"
                name="note"
                rules={[
                  { required: true, message: 'Vui lòng nhập lý do từ chối' },
                  { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Nhập lý do từ chối yêu cầu rút tiền..."
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setIsRejectModalOpen(false);
                    rejectForm.resetFields();
                  }}>
                    Hủy
                  </Button>
                  <Button 
                    danger
                    htmlType="submit" 
                    loading={actionLoading}
                    icon={<CloseCircleOutlined />}
                  >
                    Xác nhận từ chối
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Mark as Paid Modal */}
      <Modal
        title="Xác nhận đã thanh toán"
        open={isPaidModalOpen}
        onCancel={() => {
          setIsPaidModalOpen(false);
          paidForm.resetFields();
          setUploadedImageUrls([]);
        }}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <>
            <Alert
              message="Xác nhận đã chuyển tiền"
              description={
                <div className="space-y-2">
                  <p>Bạn đang xác nhận đã chuyển tiền cho yêu cầu:</p>
                  <p><strong>Số tiền:</strong> {formatCurrency(selectedRequest.amount)}</p>
                  <p><strong>Ngân hàng:</strong> {selectedRequest.bankName}</p>
                  <p><strong>Tài khoản:</strong> {selectedRequest.accountNumber} - {selectedRequest.accountName}</p>
                  <p className="text-green-600 mt-2">
                    ✅ Sau khi xác nhận, trạng thái sẽ chuyển sang ĐÃ THANH TOÁN.
                  </p>
                </div>
              }
              type="success"
              showIcon
              className="mb-4"
            />
            <Form form={paidForm} layout="vertical" onFinish={handleMarkAsPaid}>
              <Form.Item
                label="Mã thanh toán (Payout Ref)"
                name="payoutRef"
              >
                <Input
                  placeholder="Nhập mã giao dịch/chuyển khoản (không bắt buộc)"
                />
              </Form.Item>

              <Form.Item
                label="Ghi chú"
                name="note"
              >
                <TextArea
                  rows={3}
                  placeholder="Nhập ghi chú nếu cần..."
                />
              </Form.Item>

              <Form.Item
                label="Ảnh chứng minh chuyển tiền"
                required
              >
                <Upload
                  accept="image/*"
                  multiple
                  beforeUpload={(file) => {
                    handleImageUpload(file);
                    return false;
                  }}
                  showUploadList={false}
                  disabled={uploadLoading}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploadLoading}
                    block
                  >
                    {uploadLoading ? 'Đang upload...' : 'Chọn ảnh từ máy tính'}
                  </Button>
                </Upload>
                
                {uploadedImageUrls.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Đã upload {uploadedImageUrls.length} ảnh:
                    </p>
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={url}
                              alt={`Proof ${index + 1}`}
                              className="rounded border"
                              width="100%"
                              height={100}
                              style={{ objectFit: 'cover' }}
                            />
                            <Button
                              danger
                              size="small"
                              icon={<CloseCircleOutlined />}
                              className="absolute top-1 right-1"
                              onClick={() => handleRemoveImage(url)}
                            />
                          </div>
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  </div>
                )}
                
                {uploadedImageUrls.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    * Bắt buộc upload ít nhất 1 ảnh chứng minh chuyển tiền
                  </p>
                )}
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setIsPaidModalOpen(false);
                    paidForm.resetFields();
                    setUploadedImageUrls([]);
                  }}>
                    Hủy
                  </Button>
                  <Button 
                    type="primary"
                    htmlType="submit" 
                    loading={actionLoading}
                    icon={<CheckOutlined />}
                    disabled={uploadedImageUrls.length === 0}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    Xác nhận đã thanh toán
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CustomerWithdrawRequestsPage;
