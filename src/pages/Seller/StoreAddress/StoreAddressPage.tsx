import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Empty,
  Spin,
  Button,
  Descriptions,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
} from 'antd';
import {
  MapPin,
  RefreshCw,
  Home,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useStoreAddresses } from '../../../hooks/useStoreAddresses';
import { StoreAddressService } from '../../../services/seller/StoreAddressService';
import { useProvinces } from '../../../hooks/useProvinces';
import { useDistricts } from '../../../hooks/useDistricts';
import { useWards } from '../../../hooks/useWards';
import type { CreateStoreAddressRequest } from '../../../types/seller';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const { Text, Title } = Typography;

const StoreAddressPage: React.FC = () => {
  const {
    addresses,
    isLoading,
    error,
    refresh,
  } = useStoreAddresses();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  // GHN Hooks
  const { provinces, loading: provincesLoading } = useProvinces();
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');
  const { districts, loading: districtsLoading, clearDistricts } = useDistricts(selectedProvinceId);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const { wards, loading: wardsLoading, clearWards } = useWards(selectedDistrictId);
  const [selectedWardName, setSelectedWardName] = useState<string>('');

  const handleOpenModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setSelectedProvinceId(null);
    setSelectedProvinceName('');
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setSelectedWardName('');
    clearDistricts();
    clearWards();
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedProvinceId(null);
    setSelectedProvinceName('');
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setSelectedWardName('');
    clearDistricts();
    clearWards();
  };

  const handleProvinceChange = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    const selectedProvince = provinces.find(p => p.ProvinceID === provinceId);
    setSelectedProvinceName(selectedProvince?.ProvinceName || '');
    setSelectedDistrictId(null);
    setSelectedDistrictName('');
    setSelectedWardName('');
    form.setFieldsValue({ districtId: undefined, wardCode: undefined });
    clearDistricts();
    clearWards();
  };

  const handleDistrictChange = (districtId: number) => {
    setSelectedDistrictId(districtId);
    const selectedDistrict = districts.find(d => d.DistrictID === districtId);
    setSelectedDistrictName(selectedDistrict?.DistrictName || '');
    setSelectedWardName('');
    form.setFieldsValue({ wardCode: undefined });
    clearWards();
  };

  const handleWardChange = (wardCode: string) => {
    const selectedWard = wards.find(w => w.WardCode === wardCode);
    setSelectedWardName(selectedWard?.WardName || '');
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn đổi địa chỉ hiện tại thành địa chỉ mặc định của cửa hàng?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await StoreAddressService.setDefaultAddress(addressId);
      showCenterSuccess('Đặt địa chỉ mặc định thành công', 'Thành công');
      refresh();
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể đặt địa chỉ mặc định', 'Lỗi');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa địa chỉ này khỏi danh sách? Hành động này không thể hoàn tác.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await StoreAddressService.deleteStoreAddress(addressId);
      showCenterSuccess('Xóa địa chỉ thành công', 'Thành công');
      refresh();
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể xóa địa chỉ cửa hàng', 'Lỗi');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

      // Find selected province, district, ward to get their codes
      const selectedProvince = provinces.find(p => p.ProvinceID === values.provinceId);
      const selectedDistrict = districts.find(d => d.DistrictID === values.districtId);
      const selectedWard = wards.find(w => w.WardCode === values.wardCode);

      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        showCenterError('Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện và phường/xã', 'Lỗi');
        return;
      }

      // Build full address: số nhà + tên đường + phường/xã + quận/huyện + tỉnh/thành phố
      const streetAddress = values.address.trim(); // Số nhà và tên đường
      const fullAddress = [
        streetAddress,
        selectedWardName,
        selectedDistrictName,
        selectedProvinceName,
      ]
        .filter(Boolean)
        .join(', ');

      const request: CreateStoreAddressRequest = {
        defaultAddress: values.defaultAddress || false,
        provinceCode: selectedProvince.Code,
        districtCode: selectedDistrict.Code,
        wardCode: selectedWard.WardCode,
        address: fullAddress,
      };

      await StoreAddressService.createStoreAddress(request);
      
      showCenterSuccess('Thêm địa chỉ cửa hàng thành công', 'Thành công');
      handleCloseModal();
      refresh();
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể thêm địa chỉ cửa hàng', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-orange-600" />
            <Title level={2} className="!mb-0">
              Địa chỉ cửa hàng
            </Title>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenModal}
              style={{
                backgroundColor: '#ea580c',
                borderColor: '#ea580c',
              }}
              className="hover:!bg-orange-700 hover:!border-orange-700"
            >
              Thêm địa chỉ cửa hàng
            </Button>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={refresh}
              loading={isLoading}
            >
              Làm mới
            </Button>
          </Space>
        </div>
        <Text type="secondary">Quản lý địa chỉ cửa hàng của bạn</Text>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <Text type="danger">{error}</Text>
        </div>
      )}

      {/* Addresses List */}
      {isLoading && addresses.length === 0 ? (
        <div className="py-12 text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-500">Đang tải địa chỉ...</div>
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <Empty
            description="Chưa có địa chỉ cửa hàng"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {addresses.map((address) => {
            return (
              <Col xs={24} sm={24} lg={12} key={address.id}>
                <Card
                  className="h-full"
                  styles={{
                    body: { padding: '24px' },
                  }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-orange-600" />
                        <Text strong className="text-lg">
                          Địa chỉ cửa hàng
                        </Text>
                        {address.defaultAddress && (
                          <Tag color="green">Mặc định</Tag>
                        )}
                      </div>
                    </div>

                    {/* Address Details */}
                    <Descriptions
                      column={1}
                      size="small"
                      bordered
                      labelStyle={{
                        backgroundColor: '#fafafa',
                        fontWeight: 500,
                        width: '120px',
                      }}
                    >
                      <Descriptions.Item label="Địa chỉ">
                        <Text>{address.address}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Mã tỉnh/thành">
                        <Text code>{address.provinceCode}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Mã quận/huyện">
                        <Text code>{address.districtCode}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Mã phường/xã">
                        <Text code>{address.wardCode}</Text>
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-200">
                      <Space direction="vertical" className="w-full" size="small">
                        {!address.defaultAddress && (
                          <Button
                            type="default"
                            icon={<Star className="w-4 h-4" />}
                            onClick={() => handleSetDefaultAddress(address.id)}
                            block
                            style={{
                              borderColor: '#ea580c',
                              color: '#ea580c',
                            }}
                            className="hover:!border-orange-600 hover:!text-orange-600"
                          >
                            Đặt địa chỉ mặc định
                          </Button>
                        )}
                        <Button
                          type="default"
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteAddress(address.id)}
                          block
                        >
                          Xóa địa chỉ
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Add Address Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            <span>Thêm địa chỉ cửa hàng</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            defaultAddress: false,
          }}
        >
          <Form.Item
            label="Tỉnh/Thành phố"
            name="provinceId"
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              loading={provincesLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={provinces.map(p => ({
                value: p.ProvinceID,
                label: p.ProvinceName,
              }))}
              onChange={handleProvinceChange}
            />
          </Form.Item>

          <Form.Item
            label="Quận/Huyện"
            name="districtId"
            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
          >
            <Select
              placeholder="Chọn quận/huyện"
              loading={districtsLoading}
              disabled={!selectedProvinceId}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={districts.map(d => ({
                value: d.DistrictID,
                label: d.DistrictName,
              }))}
              onChange={handleDistrictChange}
            />
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            name="wardCode"
            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              loading={wardsLoading}
              disabled={!selectedDistrictId}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={wards.map(w => ({
                value: w.WardCode,
                label: w.WardName,
              }))}
              onChange={handleWardChange}
            />
          </Form.Item>

          <Form.Item
            label="Số nhà và tên đường"
            name="address"
            rules={[
              { required: true, message: 'Vui lòng nhập số nhà và tên đường' },
              { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
            ]}
            extra="Chỉ nhập số nhà và tên đường (ví dụ: 123 Nguyễn Trãi)"
          >
            <Input
              placeholder="Ví dụ: 123 Nguyễn Trãi"
              showCount
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="defaultAddress"
            valuePropName="checked"
          >
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                style={{
                  backgroundColor: '#ea580c',
                  borderColor: '#ea580c',
                }}
                className="hover:!bg-orange-700 hover:!border-orange-700"
              >
                Thêm địa chỉ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreAddressPage;

