import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Typography, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// GHN limits for return packages
const MAX_RETURN_WEIGHT = 30;      // 30kg - GHN limit
const MAX_RETURN_DIMENSION = 150;  // 150cm mỗi chiều - GHN limit

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

  // Tính max dimensions (không được quá 2cm so với dimension gốc và giới hạn GHN 150cm)
  const getMaxDimensions = () => {
    if (!productDims) {
      // Nếu không có productDims, chỉ áp dụng giới hạn GHN
      return {
        length: MAX_RETURN_DIMENSION,
        width: MAX_RETURN_DIMENSION,
        height: MAX_RETURN_DIMENSION,
      };
    }
    
    // Lấy giá trị nhỏ hơn giữa giới hạn tương đối (sản phẩm + 2cm) và giới hạn GHN tuyệt đối (150cm)
    return {
      length: Math.min(productDims.length + 2, MAX_RETURN_DIMENSION),
      width: Math.min(productDims.width + 2, MAX_RETURN_DIMENSION),
      height: Math.min(productDims.height + 2, MAX_RETURN_DIMENSION),
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
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">
                        {productWeight != null && productWeight > 0 ? (
                          <>
                            {productWeight <= 5 
                              ? `Giới hạn tương đối: Không được nhập quá ${Math.min(productWeight + 0.3, MAX_RETURN_WEIGHT).toFixed(2)} kg (sản phẩm + 0.3 kg)`
                              : `Giới hạn tương đối: Không được nhập quá ${Math.min(productWeight * 1.15, MAX_RETURN_WEIGHT).toFixed(2)} kg (sản phẩm + 15%)`
                            }
                            <br />
                            <Text type="secondary" className="text-xs text-red-600">
                              Giới hạn GHN tuyệt đối: Tối đa {MAX_RETURN_WEIGHT} kg
                            </Text>
                          </>
                        ) : (
                          <Text type="secondary" className="text-xs text-red-600">
                            Giới hạn GHN: Tối đa {MAX_RETURN_WEIGHT} kg
                          </Text>
                        )}
                      </Text>
                    </div>
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
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">
                        {productDims ? (
                          <>
                            Giới hạn tương đối: Không được nhập quá {maxDims.length} x {maxDims.width} x {maxDims.height} cm (sản phẩm + 2 cm mỗi chiều)
                            <br />
                            <Text type="secondary" className="text-xs text-red-600">
                              Giới hạn GHN tuyệt đối: Mỗi chiều tối đa {MAX_RETURN_DIMENSION} cm
                            </Text>
                          </>
                        ) : (
                          <Text type="secondary" className="text-xs text-red-600">
                            Giới hạn GHN: Mỗi chiều tối đa {MAX_RETURN_DIMENSION} cm
                          </Text>
                        )}
                      </Text>
                    </div>
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
                
                // Kiểm tra giới hạn GHN tuyệt đối trước (30kg)
                if (value > MAX_RETURN_WEIGHT) {
                  return Promise.reject(
                    new Error(`Khối lượng không được vượt quá ${MAX_RETURN_WEIGHT} kg (giới hạn GHN)`)
                  );
                }
                
                // Không được nhỏ hơn khối lượng sản phẩm
                if (productWeight != null && productWeight > 0) {
                  if (value < productWeight) {
                    return Promise.reject(
                      new Error(`Khối lượng không được nhỏ hơn ${productWeight} kg (khối lượng sản phẩm)`)
                    );
                  }
                }
                
                // Không được vượt quá giới hạn tương đối (nếu có)
                if (productWeight != null && productWeight > 0) {
                  let relativeMax: number;
                  if (productWeight <= 5) {
                    relativeMax = productWeight + 0.3;
                  } else {
                    relativeMax = productWeight * 1.15;
                  }
                  
                  if (value > relativeMax) {
                    if (productWeight <= 5) {
                      return Promise.reject(
                        new Error(`Khối lượng không được vượt quá ${relativeMax.toFixed(2)} kg (sản phẩm + 0.3 kg)`)
                      );
                    } else {
                      return Promise.reject(
                        new Error(`Khối lượng không được vượt quá ${relativeMax.toFixed(2)} kg (sản phẩm + 15%)`)
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
            min={productWeight && productWeight > 0 ? productWeight : 0.1} 
            max={MAX_RETURN_WEIGHT} 
            step={0.1} 
            className="w-full"
            precision={2}
            controls={false}
            placeholder={`≤ ${MAX_RETURN_WEIGHT} kg`}
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
                  
                  // Kiểm tra giới hạn GHN tuyệt đối trước (150cm)
                  if (value > MAX_RETURN_DIMENSION) {
                    return Promise.reject(
                      new Error(`Chiều dài không được vượt quá ${MAX_RETURN_DIMENSION} cm (giới hạn GHN)`)
                    );
                  }
                  
                  // Không được nhỏ hơn kích thước sản phẩm
                  if (productDims) {
                    if (value < productDims.length) {
                      return Promise.reject(
                        new Error(`Chiều dài không được nhỏ hơn ${productDims.length} cm (kích thước sản phẩm)`)
                      );
                    }
                  }
                  
                  // Không được vượt quá giới hạn tương đối (nếu có)
                  if (productDims) {
                    const relativeMax = productDims.length + 2;
                    if (value > relativeMax) {
                      return Promise.reject(
                        new Error(`Chiều dài không được vượt quá ${relativeMax} cm (sản phẩm + 2 cm)`)
                      );
                    }
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={productDims?.length || 1} 
              max={MAX_RETURN_DIMENSION} 
              className="w-full"
              precision={1}
              controls={false}
              placeholder={`≤ ${MAX_RETURN_DIMENSION} cm`}
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
                  
                  // Kiểm tra giới hạn GHN tuyệt đối trước (150cm)
                  if (value > MAX_RETURN_DIMENSION) {
                    return Promise.reject(
                      new Error(`Chiều rộng không được vượt quá ${MAX_RETURN_DIMENSION} cm (giới hạn GHN)`)
                    );
                  }
                  
                  // Không được nhỏ hơn kích thước sản phẩm
                  if (productDims) {
                    if (value < productDims.width) {
                      return Promise.reject(
                        new Error(`Chiều rộng không được nhỏ hơn ${productDims.width} cm (kích thước sản phẩm)`)
                      );
                    }
                  }
                  
                  // Không được vượt quá giới hạn tương đối (nếu có)
                  if (productDims) {
                    const relativeMax = productDims.width + 2;
                    if (value > relativeMax) {
                      return Promise.reject(
                        new Error(`Chiều rộng không được vượt quá ${relativeMax} cm (sản phẩm + 2 cm)`)
                      );
                    }
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={productDims?.width || 1} 
              max={MAX_RETURN_DIMENSION} 
              className="w-full"
              precision={1}
              controls={false}
              placeholder={`≤ ${MAX_RETURN_DIMENSION} cm`}
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
                  
                  // Kiểm tra giới hạn GHN tuyệt đối trước (150cm)
                  if (value > MAX_RETURN_DIMENSION) {
                    return Promise.reject(
                      new Error(`Chiều cao không được vượt quá ${MAX_RETURN_DIMENSION} cm (giới hạn GHN)`)
                    );
                  }
                  
                  // Không được nhỏ hơn kích thước sản phẩm
                  if (productDims) {
                    if (value < productDims.height) {
                      return Promise.reject(
                        new Error(`Chiều cao không được nhỏ hơn ${productDims.height} cm (kích thước sản phẩm)`)
                      );
                    }
                  }
                  
                  // Không được vượt quá giới hạn tương đối (nếu có)
                  if (productDims) {
                    const relativeMax = productDims.height + 2;
                    if (value > relativeMax) {
                      return Promise.reject(
                        new Error(`Chiều cao không được vượt quá ${relativeMax} cm (sản phẩm + 2 cm)`)
                      );
                    }
                  }
                  
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber 
              min={productDims?.height || 1} 
              max={MAX_RETURN_DIMENSION} 
              className="w-full"
              precision={1}
              controls={false}
              placeholder={`≤ ${MAX_RETURN_DIMENSION} cm`}
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


