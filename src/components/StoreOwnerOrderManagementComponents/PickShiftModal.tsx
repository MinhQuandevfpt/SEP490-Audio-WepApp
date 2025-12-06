import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Spin, message } from 'antd';
import { GhnService, type PickShift } from '../../services/seller/GhnService';

export interface PickShiftModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (shiftId: number) => Promise<void> | void;
  loading?: boolean;
}

const PickShiftModal: React.FC<PickShiftModalProps> = ({
  open,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<{ shiftId: number }>();
  const [pickShifts, setPickShifts] = useState<PickShift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  useEffect(() => {
    if (open) {
      loadPickShifts();
      form.resetFields();
    }
  }, [open, form]);

  const loadPickShifts = async () => {
    try {
      setIsLoadingShifts(true);
      const response = await GhnService.getPickShifts();
      setPickShifts(response.data || []);
    } catch (e: any) {
      message.error(e?.message || 'Không thể tải danh sách ca lấy hàng');
      setPickShifts([]);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values.shiftId);
      form.resetFields();
    } catch {
      // Validation errors are displayed by Ant Design
    }
  };

  return (
    <Modal
      title="Chọn ca lấy hàng"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Xác nhận"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form<{ shiftId: number }>
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="Ca lấy hàng"
          name="shiftId"
          rules={[{ required: true, message: 'Vui lòng chọn ca lấy hàng' }]}
        >
          {isLoadingShifts ? (
            <div className="py-4 text-center">
              <Spin size="small" />
              <p className="mt-2 text-gray-500 text-sm">Đang tải danh sách ca lấy hàng...</p>
            </div>
          ) : (
            <Select
              placeholder="Chọn ca lấy hàng"
              className="w-full"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={pickShifts.map((shift) => ({
                value: shift.id,
                label: shift.title,
              }))}
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PickShiftModal;

