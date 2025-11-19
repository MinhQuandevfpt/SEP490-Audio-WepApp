import React, { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Card,
  Spin,
  Tag,
  Space,
  Divider,
  Row,
  Col,
  Modal
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarFilled,
  EditOutlined,
  UserOutlined,
  CameraOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { StoreService } from '../../../services/seller/StoreService';
import { FileUploadService } from '../../../services/FileUploadService';
import type { StoreDetail, UpdateStoreRequest } from '../../../types/seller';

const { TextArea } = Input;

const StoreProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [storeData, setStoreData] = useState<StoreDetail | null>(null);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  
  // Image cropper states
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadStoreProfile();
  }, []);

  const loadStoreProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get store info from localStorage
      const storeInfoStr = localStorage.getItem('seller_store_info');
      if (!storeInfoStr) {
        message.error('Không tìm thấy thông tin cửa hàng');
        return;
      }

      const storeInfo = JSON.parse(storeInfoStr);
      const storeId = storeInfo.storeId;

      if (!storeId) {
        message.error('Không tìm thấy ID cửa hàng');
        return;
      }

      const data = await StoreService.getStoreDetail(storeId);
      setStoreData(data);

      // Set form values
      form.setFieldsValue({
        storeName: data.storeName,
        description: data.description,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
      });

      // Set logo image if exists
      if (data.logoUrl) {
        setLogoFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: data.logoUrl,
          },
        ]);
      }

      // Set cover image if exists
      if (data.coverImageUrl) {
        setCoverFileList([
          {
            uid: '-1',
            name: 'cover.png',
            status: 'done',
            url: data.coverImageUrl,
          },
        ]);
      }

    } catch (error) {
      console.error('Error loading store profile:', error);
      message.error('Không thể tải thông tin cửa hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    // Show cropper modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  // Calculate actual crop dimensions in pixels
  const getCropDimensions = () => {
    if (!imgRef.current || !completedCrop) return { width: 0, height: 0 };
    
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const width = Math.round(completedCrop.width * scaleX);
    const height = Math.round(completedCrop.height * scaleY);
    
    return { width, height };
  };

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropConfirm = async () => {
    try {
      message.loading({ content: 'Đang tải logo...', key: 'upload-logo' });
      
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        message.error('Không thể cắt ảnh');
        return;
      }

      // Convert blob to file
      const croppedFile = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' });
      
      const uploadResponse = await FileUploadService.uploadImage(croppedFile);
      const imageUrl = typeof uploadResponse === 'string' ? uploadResponse : uploadResponse.url;
      
      setLogoFileList([
        {
          uid: '-1',
          name: 'logo.jpg',
          status: 'done',
          url: imageUrl,
        },
      ]);
      
      form.setFieldValue('logoUrl', imageUrl);
      setCropModalVisible(false);
      setImageToCrop('');
      message.success({ content: 'Tải logo thành công!', key: 'upload-logo' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      message.error({ content: 'Tải logo thất bại', key: 'upload-logo' });
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      message.loading({ content: 'Đang tải ảnh bìa...', key: 'upload-cover' });
      const uploadResponse = await FileUploadService.uploadImage(file);
      const imageUrl = typeof uploadResponse === 'string' ? uploadResponse : uploadResponse.url;
      
      setCoverFileList([
        {
          uid: '-1',
          name: file.name,
          status: 'done',
          url: imageUrl,
        },
      ]);
      
      form.setFieldValue('coverImageUrl', imageUrl);
      message.success({ content: 'Tải ảnh bìa thành công!', key: 'upload-cover' });
      return false;
    } catch (error) {
      console.error('Error uploading cover:', error);
      message.error({ content: 'Tải ảnh bìa thất bại', key: 'upload-cover' });
      return false;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    
    // Reset form to original data
    if (storeData) {
      form.setFieldsValue({
        storeName: storeData.storeName,
        description: storeData.description,
        phoneNumber: storeData.phoneNumber,
        email: storeData.email,
        address: storeData.address,
      });

      // Reset logo
      if (storeData.logoUrl) {
        setLogoFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: storeData.logoUrl,
          },
        ]);
      } else {
        setLogoFileList([]);
      }

      // Reset cover
      if (storeData.coverImageUrl) {
        setCoverFileList([
          {
            uid: '-1',
            name: 'cover.png',
            status: 'done',
            url: storeData.coverImageUrl,
          },
        ]);
      } else {
        setCoverFileList([]);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    if (!storeData) {
      message.error('Không tìm thấy thông tin cửa hàng');
      return;
    }

    try {
      setIsSaving(true);

      const updateData: UpdateStoreRequest = {
        storeName: values.storeName,
        description: values.description,
        phoneNumber: storeData.phoneNumber || undefined,
        email: storeData.email || undefined,
        address: storeData.address || undefined,
      };

      // Add image URLs if they exist
      if (logoFileList.length > 0 && logoFileList[0].url) {
        updateData.logoUrl = logoFileList[0].url;
      }

      if (coverFileList.length > 0 && coverFileList[0].url) {
        updateData.coverImageUrl = coverFileList[0].url;
      }

      const updatedStore = await StoreService.updateStore(storeData.storeId, updateData);
      setStoreData(updatedStore);
      setIsEditing(false);
      
      message.success('Cập nhật hồ sơ shop thành công!');
    } catch (error) {
      console.error('Error updating store profile:', error);
      message.error('Cập nhật hồ sơ shop thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Đang tải thông tin cửa hàng..." />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <ShopOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <p className="mt-4 text-gray-500">Không tìm thấy thông tin cửa hàng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShopOutlined />
              Hồ sơ Shop
            </h1>
            <p className="text-gray-500 mt-1">
              Quản lý thông tin và hình ảnh cửa hàng của bạn
            </p>
          </div>
          <Space>
            
            {storeData.rating && (
              <Tag icon={<StarFilled />} color="gold">
                {storeData.rating.toFixed(1)}
              </Tag>
            )}
          </Space>
        </div>
      </div>

      {/* Store Basic Info Card */}
      <Card 
        className="mb-6"
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Thông tin cơ bản</span>
            {!isEditing && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
              >
                Chỉnh sửa
              </Button>
            )}
          </div>
        }
      >
        {!isEditing ? (
          // View Mode - Display information
          <div>
            <Row gutter={[24, 24]}>
              {/* Left Column - Logo & Cover */}
              <Col xs={24} lg={8}>
                <div className="space-y-6">
                  {/* Logo - Circular with Edit Button */}
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-500 mb-3">Logo cửa hàng</div>
                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                      {storeData.logoUrl ? (
                        <img 
                          src={storeData.logoUrl} 
                          alt="Store Logo" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserOutlined className="text-6xl text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Ảnh bìa</div>
                    {storeData.coverImageUrl ? (
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={storeData.coverImageUrl} 
                          alt="Cover" 
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg bg-gray-50 flex justify-center items-center h-40">
                        <span className="text-gray-400">Chưa có ảnh bìa</span>
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              {/* Right Column - Text Info */}
              <Col xs={24} lg={16}>
                <div className="space-y-4 flex flex-col justify-center h-full">
                  {/* Store Name */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500 mb-1">Tên cửa hàng</div>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <ShopOutlined className="text-blue-500" />
                      {storeData.storeName}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500 mb-1">Mô tả</div>
                    <div className="text-base">
                      {storeData.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-500 mb-1">Số điện thoại</div>
                    <div className="text-base flex items-center gap-2">
                      <PhoneOutlined className="text-green-500" />
                      {storeData.phoneNumber}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="pb-4">
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="text-base flex items-center gap-2">
                      <MailOutlined className="text-red-500" />
                      {storeData.email}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          // Edit Mode - Show Form
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={24}>
              {/* Left Column - Images */}
              <Col xs={24} lg={8}>
                {/* Logo - Circular Upload with Full Overlay */}
                <Form.Item label="Logo cửa hàng" className="text-center">
                  <div className="flex flex-col items-center">
                    <Upload
                      fileList={[]}
                      beforeUpload={handleLogoUpload}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 cursor-pointer group">
                        {/* Background Image or Default Icon */}
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          {logoFileList.length > 0 && logoFileList[0].url ? (
                            <img 
                              src={logoFileList[0].url} 
                              alt="Logo" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserOutlined className="text-6xl text-gray-400" />
                          )}
                        </div>
                        
                        {/* Full Overlay with Camera and Text */}
                        <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-75 transition-all flex flex-col items-center justify-center">
                          <CameraOutlined className="text-white text-3xl mb-2" />
                          <span className="text-white text-sm font-medium">Sửa</span>
                        </div>
                      </div>
                    </Upload>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Kích thước đề xuất: 200px * 200px<br />
                      (Cố định tỉ lệ khung hình để phù hợp với thiết kế)<br />
                      Định dạng: JPG, PNG
                    </p>
                  </div>
                </Form.Item>

                {/* Cover Image - Full size h-40 */}
                <Form.Item label="Ảnh bìa" className="mt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-40 flex items-center justify-center">
                    {coverFileList.length > 0 && coverFileList[0].url ? (
                      <div className="relative w-full h-full group cursor-pointer">
                        <img 
                          src={coverFileList[0].url} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                        <Upload
                          fileList={[]}
                          beforeUpload={handleCoverUpload}
                          showUploadList={false}
                          accept="image/*"
                        >
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                              <CameraOutlined className="text-3xl mb-1" />
                              <div className="text-sm font-medium">Đổi ảnh bìa</div>
                            </div>
                          </div>
                        </Upload>
                      </div>
                    ) : (
                      <Upload
                        fileList={[]}
                        beforeUpload={handleCoverUpload}
                        showUploadList={false}
                        accept="image/*"
                        className="w-full h-full flex items-center justify-center"
                      >
                        <div className="flex flex-col items-center justify-center cursor-pointer gap-2">
                          <UploadOutlined className="text-5xl text-gray-400" />
                          <span className="text-gray-500 text-base font-medium">Tải ảnh bìa lên</span>
                          <span className="text-gray-400 text-sm">Kéo thả hoặc nhấn để tải</span>
                        </div>
                      </Upload>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Kích thước đề xuất: 1200x300px. Định dạng: JPG, PNG
                  </p>
                </Form.Item>
              </Col>

              {/* Right Column - Basic Info - Centered */}
              <Col xs={24} lg={16}>
                <div className="flex flex-col justify-center h-full">
                  <Form.Item
                    label="Tên cửa hàng"
                    name="storeName"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên cửa hàng' },
                      { min: 5, message: 'Tên cửa hàng phải có ít nhất 5 ký tự' },
                      { max: 30, message: 'Tên cửa hàng không được quá 30 ký tự' },
                    ]}
                    validateTrigger={['onChange', 'onBlur']}
                  >
                    <Input
                      prefix={<ShopOutlined />}
                      placeholder="Nhập tên cửa hàng"
                      size="large"
                      showCount
                      maxLength={30}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                      { max: 500, message: 'Mô tả không được quá 500 ký tự' },
                    ]}
                  >
                    <TextArea
                      placeholder="Nhập mô tả về cửa hàng của bạn"
                      rows={4}
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Số điện thoại"
                        name="phoneNumber"
                        tooltip="Không thể thay đổi số điện thoại"
                      >
                        <Input
                          prefix={<PhoneOutlined />}
                          size="large"
                          disabled
                          className="cursor-not-allowed"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        tooltip="Không thể thay đổi email"
                      >
                        <Input
                          prefix={<MailOutlined />}
                          size="large"
                          disabled
                          className="cursor-not-allowed"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            <Divider />

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleCancel}
                disabled={isSaving}
                size="large"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={isSaving}
                size="large"
                style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        )}
      </Card>

      {/* Store Addresses Card (Read-only) */}
      {storeData.storeAddresses && storeData.storeAddresses.length > 0 && (
        <Card 
          title={
            <span className="text-lg font-semibold flex items-center gap-2">
              <EnvironmentOutlined />
              Địa chỉ chi tiết
            </span>
          }
        >
          <div className="space-y-3">
            {storeData.storeAddresses.map((addr) => (
              <Card key={addr.addressId} size="small" className="bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <EnvironmentOutlined className="text-blue-500 text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-base">{addr.address}</div>
                    {addr.defaultAddress && (
                      <Tag color="blue" className="mt-2">
                        Địa chỉ mặc định
                      </Tag>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Image Cropper Modal */}
      <Modal
        title="Chỉnh sửa hình ảnh"
        open={cropModalVisible}
        onOk={handleCropConfirm}
        onCancel={() => {
          setCropModalVisible(false);
          setImageToCrop('');
        }}
        width={600}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ 
          style: { backgroundColor: '#f97316', borderColor: '#f97316' }
        }}
      >
        {imageToCrop && (
          <div>
            <div className="flex justify-center mb-3">
              <ReactCrop
                crop={crop}
                onChange={(c: Crop) => setCrop(c)}
                onComplete={(c: Crop) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt="Crop"
                  style={{ maxWidth: '100%' }}
                  onLoad={() => {
                    // Trigger initial crop calculation when image loads
                    if (imgRef.current) {
                      const initialCrop: Crop = {
                        unit: '%',
                        width: 50,
                        height: 50,
                        x: 25,
                        y: 25
                      };
                      setCrop(initialCrop);
                      setCompletedCrop(initialCrop);
                    }
                  }}
                />
              </ReactCrop>
            </div>
            {completedCrop && (
              <div className="text-center text-sm text-gray-500">
                Kích thước hình ảnh sau khi cắt: {getCropDimensions().width}px * {getCropDimensions().height}px
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StoreProfile;
