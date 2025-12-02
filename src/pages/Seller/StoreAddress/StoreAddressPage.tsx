import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Empty,
  Spin,
  Button,
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
import { useLocation } from 'react-router-dom';

const { Text, Title } = Typography;

const StoreAddressPage: React.FC = () => {
  const location = useLocation();
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

  // Tự động mở modal tạo địa chỉ nếu được redirect từ luồng tạo sản phẩm
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');

    if (from === 'create-product' && !isLoading && addresses.length === 0) {
      // Mở popup tạo địa chỉ ngay khi vào trang
      handleOpenModal();
    }
  }, [location.search, isLoading, addresses.length]);

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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-800">
                Địa chỉ cửa hàng
              </Title>
              <Text type="secondary" className="text-sm">
                Quản lý địa chỉ cửa hàng của bạn
              </Text>
            </div>
          </div>
          <Space size="middle" className="flex-wrap">
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenModal}
              size="large"
              style={{
                backgroundColor: '#ea580c',
                borderColor: '#ea580c',
                height: '40px',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
              }}
              className="hover:!bg-orange-600 hover:!border-orange-600 hover:!shadow-lg transition-all"
            >
              Thêm địa chỉ
            </Button>
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={refresh}
              loading={isLoading}
              size="large"
              className="border-gray-300 hover:border-orange-500 hover:text-orange-500 transition-all"
            >
              Làm mới
            </Button>
          </Space>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <Text type="danger" className="font-medium">{error}</Text>
          </div>
        </div>
      )}

      {/* Addresses List */}
      {isLoading && addresses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
          <Spin size="large" />
          <div className="mt-4 text-gray-500 font-medium">Đang tải địa chỉ...</div>
        </div>
      ) : addresses.length === 0 ? (
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <Empty
            description={
              <div>
                <p className="text-gray-600 font-medium mb-1">Chưa có địa chỉ cửa hàng</p>
                <p className="text-sm text-gray-400">Hãy thêm địa chỉ đầu tiên để bắt đầu</p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {addresses.map((address) => {
            return (
              <Col xs={24} sm={24} lg={12} key={address.id}>
                <Card
                  className="h-full rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-orange-300"
                  styles={{
                    body: { padding: '28px' },
                  }}
                >
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          address.defaultAddress 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                          <Home className={`w-5 h-5 ${
                            address.defaultAddress ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text strong className="text-base text-gray-800 block mb-1">
                            Địa chỉ cửa hàng
                          </Text>
                          {address.defaultAddress && (
                            <Tag 
                              color="success" 
                              className="mt-1 rounded-full px-3 py-0.5 border-0"
                              style={{ 
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            >
                              Mặc định
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <Text className="text-gray-700 leading-relaxed text-[15px]">
                          {address.address}
                        </Text>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      <Space direction="vertical" className="w-full" size="middle">
                        {!address.defaultAddress && (
                          <Button
                            type="default"
                            icon={<Star className="w-4 h-4" />}
                            onClick={() => handleSetDefaultAddress(address.id)}
                            block
                            size="large"
                            style={{
                              borderColor: '#ea580c',
                              color: '#ea580c',
                              height: '42px',
                              fontWeight: 500,
                            }}
                            className="hover:!border-orange-600 hover:!text-orange-600 hover:!bg-orange-50 transition-all"
                          >
                            Đặt làm mặc định
                          </Button>
                        )}
                        <Button
                          type="default"
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteAddress(address.id)}
                          block
                          size="large"
                          style={{
                            height: '42px',
                            fontWeight: 500,
                          }}
                          className="hover:!bg-red-50 transition-all"
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
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">Thêm địa chỉ cửa hàng</div>
              <div className="text-xs text-gray-500 font-normal">Nhập thông tin địa chỉ mới</div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={640}
        destroyOnHidden
        styles={{
          content: {
            borderRadius: '16px',
          },
          header: {
            borderBottom: '1px solid #f0f0f0',
            padding: '20px 24px',
            marginBottom: 0,
          },
          body: {
            padding: '24px',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            defaultAddress: false,
          }}
          className="mt-2"
        >
          <Form.Item
            label={<span className="font-medium text-gray-700">Tỉnh/Thành phố</span>}
            name="provinceId"
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              loading={provincesLoading}
              showSearch
              size="large"
              className="rounded-lg"
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
            label={<span className="font-medium text-gray-700">Quận/Huyện</span>}
            name="districtId"
            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
          >
            <Select
              placeholder="Chọn quận/huyện"
              loading={districtsLoading}
              disabled={!selectedProvinceId}
              showSearch
              size="large"
              className="rounded-lg"
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
            label={<span className="font-medium text-gray-700">Phường/Xã</span>}
            name="wardCode"
            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          >
            <Select
              placeholder="Chọn phường/xã"
              loading={wardsLoading}
              disabled={!selectedDistrictId}
              showSearch
              size="large"
              className="rounded-lg"
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
            label={<span className="font-medium text-gray-700">Số nhà và tên đường</span>}
            name="address"
            rules={[
              { required: true, message: 'Vui lòng nhập số nhà và tên đường' },
              { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
            ]}
            extra={
              <span className="text-xs text-gray-500">
                Chỉ nhập số nhà và tên đường (ví dụ: 123 Nguyễn Trãi)
              </span>
            }
          >
            <Input
              placeholder="Ví dụ: 123 Nguyễn Trãi"
              showCount
              maxLength={100}
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="defaultAddress"
            valuePropName="checked"
            className="mb-6"
          >
            <Checkbox className="text-gray-700">
              <span className="font-medium">Đặt làm địa chỉ mặc định</span>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                onClick={handleCloseModal}
                size="large"
                className="px-6 rounded-lg"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                size="large"
                style={{
                  backgroundColor: '#ea580c',
                  borderColor: '#ea580c',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                }}
                className="hover:!bg-orange-600 hover:!border-orange-600 hover:!shadow-lg transition-all px-6 rounded-lg"
              >
                Thêm địa chỉ
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreAddressPage;

