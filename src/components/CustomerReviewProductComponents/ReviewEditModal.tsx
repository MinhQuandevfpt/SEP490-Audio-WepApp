import React from 'react';
import { Modal, Form, Input, Rate, Button, Space } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import type { ReviewResponse, ReviewMediaPayload } from '../../types/api';

interface ReviewEditModalProps {
  open: boolean;
  review: ReviewResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { rating: number; content: string; media: ReviewMediaPayload[] }) => void;
}

const MAX_MEDIA = 5;

const ReviewEditModal: React.FC<ReviewEditModalProps> = ({ open, review, loading, onClose, onSubmit }) => {
  const [form] = Form.useForm();

  const mediaFields = Form.useWatch('media', form) ?? review?.media ?? [];

  const handleAddMedia = () => {
    if (mediaFields.length >= MAX_MEDIA) return;
    form.setFieldsValue({
      media: [...mediaFields, { type: 'image', url: '' }],
    });
  };

  const handleRemoveMedia = (index: number) => {
    form.setFieldsValue({
      media: mediaFields.filter((__item: ReviewMediaPayload, currentIndex: number) => currentIndex !== index),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      title="Chỉnh sửa đánh giá"
      destroyOnClose
      destroyOnHidden
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          rating: review?.rating ?? 5,
          content: review?.content ?? '',
          media: review?.media ?? [],
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Điểm đánh giá"
          name="rating"
          rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
        >
          <Rate allowClear={false} disabled={loading} />
        </Form.Item>

        <Form.Item
          label="Nội dung"
          name="content"
          rules={[
            { required: true, message: 'Vui lòng nhập nội dung' },
            { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' },
          ]}
        >
          <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." disabled={loading} />
        </Form.Item>

        <Form.Item label="Link hình ảnh / video (tối đa 5)">
          <Space direction="vertical" style={{ width: '100%' }}>
            {mediaFields.map((_media: ReviewMediaPayload, index: number) => (
              <Space key={index} align="start" style={{ width: '100%' }}>
                <Form.Item
                  label={index === 0 ? 'Loại' : ''}
                  name={['media', index, 'type']}
                  rules={[{ required: true, message: 'Chọn loại media' }]}
                  style={{ minWidth: 120 }}
                >
                  <select
                    value={mediaFields[index]?.type}
                    onChange={(e) => {
                      const next = [...mediaFields];
                      next[index] = { ...next[index], type: e.target.value as ReviewMediaPayload['type'] };
                      form.setFieldsValue({ media: next });
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1"
                    disabled={loading}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </Form.Item>
                <Form.Item
                  label={index === 0 ? 'URL' : ''}
                  name={['media', index, 'url']}
                  rules={[
                    { required: true, message: 'Vui lòng nhập URL' },
                    { type: 'url', message: 'URL không hợp lệ' },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="https://..." disabled={loading} />
                </Form.Item>
                <Button
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={() => handleRemoveMedia(index)}
                  disabled={loading}
                />
              </Space>
            ))}
            {mediaFields.length < MAX_MEDIA && (
              <Button icon={<Plus size={16} />} onClick={handleAddMedia} disabled={loading}>
                Thêm media
              </Button>
            )}
          </Space>
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="flex justify-end w-full">
            <Button onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật đánh giá
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReviewEditModal;

