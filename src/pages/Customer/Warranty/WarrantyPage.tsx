import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Card, Empty, Spin, Typography, Button, Tag, Row, Col, Statistic } from 'antd';
import { Shield, Wrench, Calendar, Package, Store, ArrowLeft, CheckCircle } from 'lucide-react';
import { WarrantyService } from '../../../services/customer/WarrantyService';
import type { Warranty } from '../../../types/api';
import { formatDate } from '../../../utils/orderStatus';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const { Text, Title } = Typography;

const WarrantyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repairingWarrantyId, setRepairingWarrantyId] = useState<string | null>(null);

  // Load warranties
  useEffect(() => {
    const loadWarranties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await WarrantyService.getWarrantiesByEmail();
        // Filter only ACTIVE and stillValid warranties with valid id (from DELIVERY_SUCCESS orders)
        // Exclude PENDING_ACTIVATION warranties as they are not yet activated
        const activeWarranties = data.filter(
          w => w.id !== null && w.status === 'ACTIVE' && w.stillValid && w.startDate !== null && w.endDate !== null
        );
        setWarranties(activeWarranties);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải danh sách bảo hành');
        setWarranties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWarranties();
  }, []);

  // Handle repair action from navigation state
  useEffect(() => {
    const state = location.state as { warrantyId?: string; action?: string } | null;
    if (state?.warrantyId && state?.action === 'repair') {
      setRepairingWarrantyId(state.warrantyId);
      // Scroll to warranty card
      setTimeout(() => {
        const element = document.getElementById(`warranty-${state.warrantyId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleRepair = async (warranty: Warranty) => {
    try {
      // TODO: Implement repair request API call
      // For now, just show success message
      showCenterSuccess(
        `Yêu cầu sửa chữa cho sản phẩm "${warranty.productName}" đã được gửi`,
        'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất'
      );
      
      // You can add API call here:
      // if (warranty.id) {
      //   await WarrantyService.requestRepair(warranty.id, { ... });
      // }
      
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể gửi yêu cầu sửa chữa', 'Lỗi');
    }
  };

  const getStatusColor = (warranty: Warranty) => {
    if (!warranty.stillValid) return 'red';
    if (warranty.status === 'ACTIVE') return 'green';
    if (warranty.status === 'EXPIRED') return 'red';
    if (warranty.status === 'VOID') return 'default';
    if (warranty.status === 'TRANSFERRED') return 'blue';
    if (warranty.status === 'PENDING_ACTIVATION') return 'orange';
    return 'default';
  };

  const getStatusText = (warranty: Warranty) => {
    if (!warranty.stillValid) return 'Hết hạn';
    if (warranty.status === 'ACTIVE') return 'Còn hiệu lực';
    if (warranty.status === 'EXPIRED') return 'Đã hết hạn';
    if (warranty.status === 'VOID') return 'Đã hủy';
    if (warranty.status === 'TRANSFERRED') return 'Đã chuyển nhượng';
    if (warranty.status === 'PENDING_ACTIVATION') return 'Chờ kích hoạt';
    return warranty.status;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/account')}
            className="mb-4"
          >
            Quay lại
          </Button>
          <Title level={2} className="!mb-2">Bảo hành sản phẩm</Title>
          <Text type="secondary">
            Quản lý và yêu cầu sửa chữa cho các sản phẩm đã mua
          </Text>
        </div>

        {/* Statistics */}
        {warranties.length > 0 && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Tổng số bảo hành"
                  value={warranties.length}
                  prefix={<Shield className="w-4 h-4" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Còn hiệu lực"
                  value={warranties.filter(w => w.stillValid).length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircle className="w-4 h-4" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Hết hạn"
                  value={warranties.filter(w => !w.stillValid).length}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Warranty List */}
        {isLoading ? (
          <div className="py-12 text-center">
            <Spin size="large" style={{ color: '#f97316' }} />
            <p className="mt-4 text-gray-500">Đang tải danh sách bảo hành...</p>
          </div>
        ) : error ? (
          <Card>
            <div className="py-8 text-center">
              <Text type="danger" className="text-base">{error}</Text>
            </div>
          </Card>
        ) : warranties.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p className="text-gray-600 font-medium mb-1">Bạn chưa có sản phẩm nào được bảo hành</p>
                  <p className="text-sm text-gray-400">
                    Các sản phẩm từ đơn hàng đã giao hàng thành công sẽ tự động được bảo hành
                  </p>
                </div>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {warranties.map((warranty, index) => {
              // Use warranty.id if available, otherwise use index
              const warrantyId = warranty.id || `warranty-${index}`;
              const warrantyElementId = `warranty-${warrantyId}`;
              
              return (
              <Card
                key={warrantyId}
                id={warrantyElementId}
                className={`border-gray-200 hover:border-orange-400 hover:shadow-md transition-all ${
                  repairingWarrantyId === warranty.id ? 'border-orange-500 border-2' : ''
                }`}
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Title level={4} className="!mb-0 !text-gray-900">
                            {warranty.productName}
                          </Title>
                          <Tag color={getStatusColor(warranty)}>
                            {getStatusText(warranty)}
                          </Tag>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Store className="w-4 h-4" />
                          <Text type="secondary">{warranty.storeName}</Text>
                        </div>
                        {warranty.serialNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-gray-400" />
                            <Text type="secondary">Số seri: </Text>
                            <Text className="font-mono font-medium">{warranty.serialNumber}</Text>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warranty Details Grid */}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Text type="secondary" className="text-xs block mb-1">Ngày mua</Text>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <Text className="text-sm font-medium">
                              {formatDate(warranty.purchaseDate)}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Text type="secondary" className="text-xs block mb-1">Bắt đầu</Text>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <Text className="text-sm font-medium">
                              {warranty.startDate ? formatDate(warranty.startDate) : 'Chưa kích hoạt'}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Text type="secondary" className="text-xs block mb-1">Kết thúc</Text>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <Text className="text-sm font-medium">
                              {warranty.endDate ? formatDate(warranty.endDate) : 'Chưa kích hoạt'}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Text type="secondary" className="text-xs block mb-1">Thời hạn</Text>
                          <Text className="text-sm font-medium block">
                            {warranty.durationMonths} tháng
                          </Text>
                        </div>
                      </Col>
                    </Row>

                    {/* Policy Info */}
                    {warranty.policyCode && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Text type="secondary" className="text-xs">Mã chính sách: </Text>
                        <Text className="text-sm font-medium">{warranty.policyCode}</Text>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex flex-col justify-start">
                    {warranty.stillValid && warranty.status === 'ACTIVE' ? (
                      <Button
                        type="primary"
                        size="large"
                        icon={<Wrench className="w-4 h-4" />}
                        onClick={() => handleRepair(warranty)}
                        style={{ 
                          backgroundColor: '#f97316', 
                          borderColor: '#f97316',
                          borderRadius: '8px',
                          minWidth: '140px'
                        }}
                      >
                        Sửa chữa
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="large"
                        style={{ 
                          borderRadius: '8px',
                          minWidth: '140px'
                        }}
                      >
                        Hết hạn bảo hành
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WarrantyPage;

