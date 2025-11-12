import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Switch,
  DatePicker,
  Space,
  Modal,
  InputNumber,
  Divider,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  PictureOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AdminBannerService } from '../../../services/admin/AdminBannerService';
import type { Banner, BannerImage, CreateBannerRequest } from '../../../types/admin';
import { showError, showSuccess } from '../../../utils/notification';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface BannerImageForm extends Omit<BannerImage, 'id'> {
  id?: string;
}

const BannerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id, mode } = useParams<{ id?: string; mode?: 'edit' | 'create' }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [images, setImages] = useState<BannerImageForm[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  const isCreateMode = mode === 'create' || !id;
  const isEditMode = mode === 'edit';
  const isViewMode = !isCreateMode && !isEditMode;

  useEffect(() => {
    if (id && !isCreateMode) {
      fetchBannerDetail();
    } else {
      // Initialize with one empty image for create mode
      setImages([{
        imageUrl: '',
        redirectUrl: '',
        altText: '',
        sortOrder: 0,
      }]);
    }
  }, [id, isCreateMode]);

  const fetchBannerDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await AdminBannerService.getBannerById(id);
      setBanner(data);
      setImages(data.images);
      
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        bannerType: data.bannerType,
        active: data.active,
        timeRange: [dayjs(data.startTime), dayjs(data.endTime)],
      });
    } catch (error) {
      showError('Không thể tải chi tiết banner');
      console.error('Error fetching banner detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setImages([
      ...images,
      {
        imageUrl: '',
        redirectUrl: '',
        altText: '',
        sortOrder: images.length,
      },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update sort order
    newImages.forEach((img, i) => {
      img.sortOrder = i;
    });
    setImages(newImages);
  };

  const handleImageChange = (index: number, field: keyof BannerImageForm, value: any) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      [field]: value,
    };
    setImages(newImages);
  };

  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const handleSubmit = async (values: any) => {
    // Validate images
    if (images.length === 0) {
      showError('Vui lòng thêm ít nhất 1 ảnh cho banner');
      return;
    }

    for (let i = 0; i < images.length; i++) {
      if (!images[i].imageUrl.trim()) {
        showError(`Vui lòng nhập URL ảnh cho ảnh thứ ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const [startTime, endTime] = values.timeRange;
      
      const bannerData: CreateBannerRequest = {
        title: values.title,
        description: values.description,
        bannerType: values.bannerType,
        active: values.active ?? true,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        images: images.map(({ id, ...rest }) => rest), // Remove id for create/update
      };

      if (isEditMode && id) {
        await AdminBannerService.updateBanner(id, bannerData);
        showSuccess('Cập nhật banner thành công');
      } else {
        await AdminBannerService.createBanner(bannerData);
        showSuccess('Tạo banner thành công');
      }
      
      navigate('/admin/banners');
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/banners');
  };

  const handleEdit = () => {
    navigate(`/admin/banners/${id}/edit`);
  };

  if (loading && !isCreateMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mb-4"
        >
          Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isCreateMode ? 'Tạo banner mới' : isEditMode ? 'Chỉnh sửa banner' : 'Chi tiết banner'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isCreateMode
                ? 'Điền thông tin để tạo banner quảng cáo mới'
                : isEditMode
                ? 'Cập nhật thông tin banner'
                : 'Xem thông tin chi tiết banner'}
            </p>
          </div>
          {isViewMode && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleEdit}
            >
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          active: true,
        }}
        disabled={isViewMode}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card title="Thông tin cơ bản" className="shadow-sm">
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input placeholder="Nhập tiêu đề banner" size="large" />
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
              >
                <TextArea
                  placeholder="Nhập mô tả banner"
                  rows={4}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label="Loại banner"
                name="bannerType"
                rules={[{ required: true, message: 'Vui lòng nhập loại banner' }]}
              >
                <Input placeholder="VD: HOME_SLIDER, PROMOTION, CATEGORY" size="large" />
              </Form.Item>
            </Card>

            {/* Images Management */}
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <span>Danh sách ảnh banner</span>
                  {!isViewMode && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleAddImage}
                      size="small"
                    >
                      Thêm ảnh
                    </Button>
                  )}
                </div>
              }
              className="shadow-sm"
            >
              {images.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PictureOutlined className="text-4xl mb-2" />
                  <p>Chưa có ảnh nào</p>
                  {!isViewMode && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddImage}
                      className="mt-4"
                    >
                      Thêm ảnh đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <Space direction="vertical" size="large" className="w-full">
                  {images.map((image, index) => (
                    <Card
                      key={index}
                      size="small"
                      title={`Ảnh ${index + 1}`}
                      extra={
                        !isViewMode && images.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveImage(index)}
                            size="small"
                          >
                            Xóa
                          </Button>
                        )
                      }
                      className="border-2 border-gray-200"
                    >
                      <div className="space-y-4">
                        {/* Image URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL ảnh <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            value={image.imageUrl}
                            onChange={(e) =>
                              handleImageChange(index, 'imageUrl', e.target.value)
                            }
                            prefix={<PictureOutlined />}
                            disabled={isViewMode}
                          />
                          {image.imageUrl && (
                            <div className="mt-2">
                              <img
                                src={image.imageUrl}
                                alt={image.altText || `Banner ${index + 1}`}
                                className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                                onClick={() =>
                                  handlePreview(
                                    image.imageUrl,
                                    `Ảnh ${index + 1}`
                                  )
                                }
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Redirect URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link chuyển hướng
                          </label>
                          <Input
                            placeholder="https://example.com/product/123"
                            value={image.redirectUrl}
                            onChange={(e) =>
                              handleImageChange(index, 'redirectUrl', e.target.value)
                            }
                            prefix={<LinkOutlined />}
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Alt Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Văn bản thay thế (Alt Text)
                          </label>
                          <Input
                            placeholder="Mô tả ngắn gọn về ảnh"
                            value={image.altText}
                            onChange={(e) =>
                              handleImageChange(index, 'altText', e.target.value)
                            }
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Sort Order */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thứ tự hiển thị
                          </label>
                          <InputNumber
                            value={image.sortOrder}
                            onChange={(value) =>
                              handleImageChange(index, 'sortOrder', value ?? 0)
                            }
                            min={0}
                            className="w-full"
                            disabled={isViewMode}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Time */}
            <Card title="Trạng thái & Thời gian" className="shadow-sm">
              <Form.Item
                label="Kích hoạt"
                name="active"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Bật"
                  unCheckedChildren="Tắt"
                  disabled={isViewMode}
                />
              </Form.Item>

              <Divider />

              <Form.Item
                label="Thời gian hiển thị"
                name="timeRange"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <RangePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                  disabled={isViewMode}
                  placeholder={['Bắt đầu', 'Kết thúc']}
                />
              </Form.Item>
            </Card>

            {/* Banner Info (View Mode) */}
            {isViewMode && banner && (
              <Card title="Thông tin banner" className="shadow-sm">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <p className="font-mono text-xs mt-1 break-all">{banner.id}</p>
                  </div>
                  <Divider className="my-2" />
                  <div>
                    <span className="text-gray-600">Ngày tạo:</span>
                    <p className="mt-1">
                      {new Date(banner.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {banner.updatedAt && (
                    <>
                      <Divider className="my-2" />
                      <div>
                        <span className="text-gray-600">Cập nhật lần cuối:</span>
                        <p className="mt-1">
                          {new Date(banner.updatedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Actions */}
            {!isViewMode && (
              <Card className="shadow-sm">
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="large"
                    block
                    loading={loading}
                  >
                    {isCreateMode ? 'Tạo banner' : 'Lưu thay đổi'}
                  </Button>
                  <Button size="large" block onClick={handleBack}>
                    Hủy
                  </Button>
                </Space>
              </Card>
            )}
          </div>
        </div>
      </Form>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img
          alt="preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default BannerDetail;
