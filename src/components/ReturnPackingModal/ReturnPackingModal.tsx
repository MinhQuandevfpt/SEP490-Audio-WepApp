import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Typography, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface PackingFormValues {
  weight: number;
  length: number;
  width: number;
  height: number;
  customerAddressId: string;
  storeAddressId: string;
}

export interface ReturnPackingModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: PackingFormValues) => Promise<void> | void;
  initialValues?: Partial<PackingFormValues>;
  loading?: boolean;
  productWeight?: number | null; // Weight của sản phẩm (kg)
  productDimensions?: string | null; // Dimensions của sản phẩm (format: "L x W x H mm/cm")
}

const ReturnPackingModal: React.FC<ReturnPackingModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
  productWeight,
  productDimensions,
}) => {
  const [form] = Form.useForm<PackingFormValues>();

  // Parse dimensions từ string (format: "L x W x H mm/cm")
  const parseDimensions = (dimensionsStr: string | null | undefined): { length: number; width: number; height: number } | null => {
    if (!dimensionsStr) return null;

    try {
      const raw = dimensionsStr.toLowerCase();
      const isMM = raw.includes('mm');
      const isCM = raw.includes('cm');
      
      // Extract numbers
      const digits = raw
        .replace(/cm/g, '')
        .replace(/mm/g, '')
        .replace(/[^0-9x ]/g, '')
        .trim();
      
      const parts = digits.split('x').map(p => p.trim()).filter(Boolean);
      const [l = '', w = '', h = ''] = parts;
      
      if (!l || !w || !h) return null;
      
      let length = parseFloat(l);
      let width = parseFloat(w);
      let height = parseFloat(h);
      
      // Convert mm to cm nếu cần
      if (isMM && !isCM) {
        length = length / 10;
        width = width / 10;
        height = height / 10;
      }
      
      return { length, width, height };
    } catch {
      return null;
    }
  };

  const productDims = parseDimensions(productDimensions);

  // Tính toán max weight cho phép dựa trên product weight
  const getMaxWeight = (): number | undefined => {
    if (productWeight == null || productWeight <= 0) {
      return undefined;
    }

    // Nếu sản phẩm <= 5kg: không được nhập quá 0.3kg so với weight
    if (productWeight <= 5) {
      return productWeight + 0.3;
    }
    
    // Nếu sản phẩm > 5kg: không được nhập quá 15% so với weight
    return productWeight * 1.15;
  };

  const maxWeight = getMaxWeight();

  // Tính max dimensions (không được quá 2cm so với dimension gốc)
  const getMaxDimensions = () => {
    if (!productDims) return null;
    return {
      length: productDims.length + 2,
      width: productDims.width + 2,
      height: productDims.height + 2,
    };
  };

  const maxDims = getMaxDimensions();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch {
      // Validation errors are displayed by Ant Design
    }
  };

  useEffect(() => {
    if (open) {
      // Chỉ set các giá trị cần thiết (customerAddressId, storeAddressId)
      // Không set length, width, height, weight để người dùng tự nhập
      if (initialValues) {
        form.setFieldsValue({
          customerAddressId: initialValues.customerAddressId,
          storeAddressId: initialValues.storeAddressId,
        } as Partial<PackingFormValues>);
      } else {
        form.resetFields();
      }
    } else {
      // Reset form khi đóng modal
      form.resetFields();
    }
  }, [open, initialValues, form]);

  return (
    <Modal
      title="Thông tin đóng gói & hoàn đơn"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Xác nhận"
      cancelText="Hủy"
      destroyOnClose
    >
      {(productWeight != null && productWeight > 0) || productDims ? (
        <Alert
          message={
            <div className="space-y-2">
              {productWeight != null && productWeight > 0 && (
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-blue-500" />
                  <div>
                    <Text>
                      Khối lượng sản phẩm: <Text strong>{productWeight} kg</Text>
                    </Text>
                    {maxWeight && (
                      <div className="mt-1">
                        <Text type="secondary" className="text-xs">
                          {productWeight <= 5 
                            ? `Giới hạn: Không được nhập quá ${maxWeight.toFixed(2)} kg (sản phẩm + 0.3 kg)`
                            : `Giới hạn: Không được nhập quá ${maxWeight.toFixed(2)} kg (sản phẩm + 15%)`
                          }
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {productDims && (
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-blue-500" />
                  <div>
                    <Text>
                      Kích thước sản phẩm: <Text strong>
                        {productDims.length} x {productDims.width} x {productDims.height} cm
                      </Text>
                    </Text>
                    {maxDims && (
                      <div className="mt-1">
                        <Text type="secondary" className="text-xs">
                          Giới hạn: Không được nhập quá {maxDims.length} x {maxDims.width} x {maxDims.height} cm (sản phẩm + 2 cm mỗi chiều)
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          }
          type="info"
          showIcon={false}
          className="mb-4"
        />
      ) : null}
      
      <Form<PackingFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          // Chỉ set các giá trị cần thiết (hidden fields)
          customerAddressId: initialValues?.customerAddressId || '',
          storeAddressId: initialValues?.storeAddressId || '',
          // Không set weight, length, width, height để người dùng tự nhập
        }}
      >
        <Form.Item
          label="Khối lượng (kg)"
          name="weight"
          rules={[
            { required: true, message: 'Vui lòng nhập khối lượng' },
            {
              validator: (_, value) => {
                if (!value || value <= 0) {
                  return Promise.reject(new Error('Khối lượng phải lớn hơn 0'));
                }
                
                if (productWeight != null && productWeight > 0 && maxWeight) {
                  if (value > maxWeight) {
                    if (productWeight <= 5) {
                      return Promise.reject(
                        new Error(`Khối lượng không được vượt quá ${maxWeight.toFixed(2)} kg (sản phẩm + 0.3 kg)`)
                      );
                    } else {
                      return Promise.reject(
                        new Error(`Khối lượng không được vượt quá ${maxWeight.toFixed(2)} kg (sản phẩm + 15%)`)
                      );
                    }
                  }
                }
                
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber 
            min={0.1} 
            max={maxWeight} 
            step={0.1} 
            className="w-full"
            precision={2}
            controls={false}
          />
        </Form.Item>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item
            label="Dài (cm)"
            name="length"
            rules={[
              { required: true, message: 'Vui lòng nhập chiều dài' },
              {
                validator: (_, value) => {
                  if (!value || value <= 0) {
                    return Promise.reject(new Error('Chiều dài phải lớn hơn 0'));
                  }
                  
                  if (productDims && maxDims && value > maxDims.length) {
                    return Promise.reject(
                      new Error(`Chiều dài không được vượt quá ${maxDims.length} cm (sản phẩm + 2 cm)`)
                    );
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={1} 
              max={maxDims?.length} 
              className="w-full"
              precision={1}
              controls={false}
            />
          </Form.Item>
          <Form.Item
            label="Rộng (cm)"
            name="width"
            rules={[
              { required: true, message: 'Vui lòng nhập chiều rộng' },
              {
                validator: (_, value) => {
                  if (!value || value <= 0) {
                    return Promise.reject(new Error('Chiều rộng phải lớn hơn 0'));
                  }
                  
                  if (productDims && maxDims && value > maxDims.width) {
                    return Promise.reject(
                      new Error(`Chiều rộng không được vượt quá ${maxDims.width} cm (sản phẩm + 2 cm)`)
                    );
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={1} 
              max={maxDims?.width} 
              className="w-full"
              precision={1}
              controls={false}
            />
          </Form.Item>
          <Form.Item
            label="Cao (cm)"
            name="height"
            rules={[
              { required: true, message: 'Vui lòng nhập chiều cao' },
              {
                validator: (_, value) => {
                  if (!value || value <= 0) {
                    return Promise.reject(new Error('Chiều cao phải lớn hơn 0'));
                  }
                  
                  if (productDims && maxDims && value > maxDims.height) {
                    return Promise.reject(
                      new Error(`Chiều cao không được vượt quá ${maxDims.height} cm (sản phẩm + 2 cm)`)
                    );
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={1} 
              max={maxDims?.height} 
              className="w-full"
              precision={1}
              controls={false}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="customerAddressId"
          hidden
          rules={[{ required: true, message: 'Vui lòng nhập customerAddressId' }]}
        >
          <Input type="hidden" />
        </Form.Item>

        <Form.Item
          name="storeAddressId"
          hidden
          rules={[{ required: true, message: 'Vui lòng nhập storeAddressId' }]}
        >
          <Input type="hidden" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReturnPackingModal;


