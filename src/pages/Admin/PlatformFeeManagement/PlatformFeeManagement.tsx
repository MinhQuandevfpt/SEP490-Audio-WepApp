import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Alert, Space, Typography, Button, Modal, Form, InputNumber, Input, Switch, DatePicker, message } from 'antd';
import { DollarSign, Plus, Edit } from 'lucide-react';
import { AdminPlatformFeeService } from '../../../services/admin/AdminPlatformFeeService';
import type { PlatformFee, CreatePlatformFeeRequest } from '../../../types/admin';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const PlatformFeeManagement: React.FC = () => {
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFee, setEditingFee] = useState<PlatformFee | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPlatformFees();
  }, []);

  const loadPlatformFees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminPlatformFeeService.getPlatformFees();
      setFees(data);
    } catch (err: any) {
      console.error('Error loading platform fees:', err);
      setError(err?.message || 'Không thể tải danh sách phí nền tảng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleSaveFee = async (values: any) => {
    try {
      setSubmitLoading(true);
      
      const now = new Date().toISOString();
      const request: CreatePlatformFeeRequest = {
        feeId: isEditMode && editingFee ? editingFee.feeId : '', // Nếu edit thì dùng feeId hiện tại, nếu không thì rỗng
        percentage: values.percentage,
        effectiveDate: values.effectiveDate.toISOString(),
        description: values.description || '',
        isActive: values.isActive ?? true,
        createdAt: isEditMode && editingFee ? editingFee.createdAt : now, // Giữ nguyên createdAt khi edit
        updatedAt: now
      };

      await AdminPlatformFeeService.savePlatformFee(request);
      message.success(isEditMode ? 'Cập nhật phí nền tảng thành công' : 'Tạo phí nền tảng thành công');
      handleCloseModal();
      loadPlatformFees(); // Reload danh sách
    } catch (err: any) {
      console.error('Error saving platform fee:', err);
      message.error(err?.message || (isEditMode ? 'Không thể cập nhật phí nền tảng' : 'Không thể tạo phí nền tảng'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingFee(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      effectiveDate: dayjs()
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fee: PlatformFee) => {
    setIsEditMode(true);
    setEditingFee(fee);
    form.resetFields();
    form.setFieldsValue({
      percentage: fee.percentage,
      effectiveDate: dayjs(fee.effectiveDate),
      description: fee.description,
      isActive: fee.isActive
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!submitLoading) {
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingFee(null);
      form.resetFields();
    }
  };

  const columns: ColumnsType<PlatformFee> = [
    {
      title: 'STT',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'ID',
      dataIndex: 'feeId',
      key: 'feeId',
      width: 250,
      render: (text: string) => (
        <span className="font-mono text-xs">{text}</span>
      )
    },
    {
      title: 'Phần trăm (%)',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 150,
      align: 'right',
      render: (percentage: number) => (
        <span className="font-semibold text-blue-600">{percentage}%</span>
      ),
      sorter: (a, b) => a.percentage - b.percentage
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: false,
      render: (text: string) => (
        <div className="break-words whitespace-normal">{text || '-'}</div>
      )
    },
    {
      title: 'Ngày hiệu lực',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 200,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 150,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Đang áp dụng' : 'Không áp dụng'}
        </Tag>
      ),
      filters: [
        { text: 'Đang áp dụng', value: true },
        { text: 'Không áp dụng', value: false }
      ],
      onFilter: (value, record) => record.isActive === value
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: PlatformFee) => (
        <Button
          type="link"
          icon={<Edit className="w-4 h-4" />}
          onClick={() => handleOpenEditModal(record)}
          size="small"
        >
          Chỉnh sửa
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Title level={2} className="!mb-2 !text-gray-900">
            <Space>
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span>Quản lý Phí Nền Tảng</span>
            </Space>
          </Title>
          <p className="text-gray-600">
            Quản lý và theo dõi các mức phí nền tảng áp dụng cho cửa hàng
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
          size="large"
        >
          Tạo phí nền tảng
        </Button>
      </div>

      {/* Content */}
      <Card className="shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Đang tải danh sách phí nền tảng...</p>
          </div>
        ) : error ? (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <button
                onClick={loadPlatformFees}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Thử lại
              </button>
            }
          />
        ) : (
          <div className="platform-fee-table-wrapper">
            <style>{`
              .platform-fee-table-wrapper .ant-table-thead > tr > th {
                padding: 16px 20px !important;
                white-space: nowrap !important;
                font-weight: 600 !important;
              }
              .platform-fee-table-wrapper .ant-table-tbody > tr > td {
                padding: 16px 20px !important;
                vertical-align: top !important;
              }
              .platform-fee-table-wrapper .ant-table {
                font-size: 14px;
              }
            `}</style>
            <Table
              columns={columns}
              dataSource={fees}
              rowKey="feeId"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng: ${total} mức phí`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1600 }}
            />
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? 'Chỉnh sửa phí nền tảng' : 'Tạo phí nền tảng mới'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={submitLoading}
        okText={isEditMode ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveFee}
          initialValues={{
            isActive: true,
            effectiveDate: dayjs()
          }}
        >
          <Form.Item
            label="Phần trăm (%)"
            name="percentage"
            rules={[
              { required: true, message: 'Vui lòng nhập phần trăm phí' },
              { type: 'number', min: 0, max: 100, message: 'Phần trăm phải từ 0 đến 100' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Nhập phần trăm phí (ví dụ: 5)"
              min={0}
              max={100}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="Ngày hiệu lực"
            name="effectiveDate"
            rules={[{ required: true, message: 'Vui lòng chọn ngày hiệu lực' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Chọn ngày hiệu lực"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập mô tả phí nền tảng (ví dụ: phí 5%)"
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Không áp dụng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformFeeManagement;

