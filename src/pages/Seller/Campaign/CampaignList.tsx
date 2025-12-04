import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Tag, Button, Tabs, Input, Empty, Spin, Space, Row, Col, Statistic
} from 'antd';
import {
  FireOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import { StoreService } from '../../../services/seller/StoreService';
import type { CampaignForSeller } from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';
import JoinCampaignModal from './JoinCampaignModal';

const SellerCampaignList: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignForSeller[]>([]);
  const [joinedCampaigns, setJoinedCampaigns] = useState<CampaignForSeller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignForSeller | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get store ID first
      const id = await StoreService.getStoreId();
      setStoreId(id);
      
      // Fetch both lists
      await Promise.all([
        fetchCampaigns(),
        fetchJoinedCampaigns(id)
      ]);
    } catch (error: any) {
      console.error('❌ Error initializing data:', error);
      showTikiNotification(
        error.message || 'Không thể tải dữ liệu',
        'Lỗi',
        'error'
      );
    }
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const allData = await SellerCampaignService.getAllCampaigns();
      console.log('📦 All campaigns from API:', allData);
      
      // ✅ Chỉ lấy campaigns có status = ONOPEN (đang mở đăng ký)
      const openCampaigns = allData.filter(c => c.status === 'ONOPEN');
      console.log('✅ Filtered ONOPEN campaigns:', openCampaigns.length, openCampaigns);
      
      setCampaigns(openCampaigns);
    } catch (error: any) {
      console.error('❌ Error fetching campaigns:', error);
      showTikiNotification(
        error.message || 'Không thể tải danh sách chiến dịch',
        'Lỗi',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJoinedCampaigns = async (id?: string) => {
    if (!id && !storeId) return;
    
    setIsLoading(true);
    try {
      const targetStoreId = id || storeId!;
      const data = await SellerCampaignService.getJoinedCampaigns(targetStoreId);
      console.log('📦 Joined campaigns from API:', data);
      
      setJoinedCampaigns(data);
    } catch (error: any) {
      console.error('❌ Error fetching joined campaigns:', error);
      showTikiNotification(
        error.message || 'Không thể tải danh sách chiến dịch đã tham gia',
        'Lỗi',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter campaigns based on search only (all are ONOPEN already)
  const filteredCampaigns = useMemo(() => {
    // Determine which list to filter based on active tab
    const isJoinedTab = activeTab === 'joined';
    let filtered = isJoinedTab ? joinedCampaigns : campaigns;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.code.toLowerCase().includes(searchText.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by tab (type) - only for non-joined tabs
    if (!isJoinedTab) {
      if (activeTab === 'mega') {
        filtered = filtered.filter(c => c.type === 'MEGA_SALE');
      } else if (activeTab === 'flash') {
        filtered = filtered.filter(c => c.type === 'FAST_SALE');
      }
    }

    return filtered;
  }, [campaigns, joinedCampaigns, activeTab, searchText]);

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      mega: campaigns.filter(c => c.type === 'MEGA_SALE').length,
      flash: campaigns.filter(c => c.type === 'FAST_SALE').length,
      joined: joinedCampaigns.length,
    }),
    [campaigns, joinedCampaigns]
  );

  const getStatusTag = (status: CampaignForSeller['status']) => {
    const config: Record<
      CampaignForSeller['status'],
      { color: string; text: string }
    > = {
      DRAFT: { color: 'default', text: 'Bản nháp' },
      ONOPEN: { color: 'success', text: 'Mở đăng ký' },
      ACTIVE: { color: 'processing', text: 'Đang diễn ra' },
      APPROVE: { color: 'purple', text: 'Đã duyệt' },
      DISABLED: { color: 'warning', text: 'Vô hiệu hóa' },
      EXPIRED: { color: 'error', text: 'Hết hạn' },
    };

    const { color, text } = config[status];
    return (
      <Tag color={color} className="font-medium">
        {text}
      </Tag>
    );
  };

    const handleJoinCampaign = (campaign: CampaignForSeller) => {
    setSelectedCampaign(campaign);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCampaign(null);
  };

  const handleJoinSuccess = () => {
    // Refresh both campaign lists after successful join
    fetchCampaigns();
    if (storeId) {
      fetchJoinedCampaigns(storeId);
    }
  };

  const CampaignCard = ({ campaign, isJoined = false }: { campaign: CampaignForSeller; isJoined?: boolean }) => {
    const isMegaSale = campaign.type === 'MEGA_SALE';
    const canJoin = SellerCampaignService.canJoinCampaign(
      campaign.status,
      campaign.startTime
    );

    return (
      <Card
        hoverable
        className="mb-6 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0 flex flex-col"
        bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Campaign Header: image left, info right */}
        <div className="bg-white p-4">
          <div className="flex items-start gap-4">
            {/* Left Image */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-50">
              {campaign.badgeIconUrl ? (
                <img
                  src={campaign.badgeIconUrl}
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #f97316dd, #f97316)' }}
                />
              )}
            </div>

            {/* Right Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isMegaSale ? (
                  <FireOutlined className="text-orange-600" />
                ) : (
                  <ThunderboltOutlined className="text-orange-600" />
                )}
                <Tag color="gold" className="font-semibold">{SellerCampaignService.getTypeLabel(campaign.type)}</Tag>
                {isJoined && (
                  <Tag color="green" icon={<CheckCircleOutlined />} className="font-semibold">
                    Đã tham gia
                  </Tag>
                )}
                <div className="ml-auto">{getStatusTag(campaign.status)}</div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">{campaign.name}</h3>
              <div className="text-sm text-gray-600 mb-1">Mã: <span className="font-medium text-gray-800">{campaign.code}</span></div>
              <div className="text-sm text-gray-800 font-medium space-y-0.5">
                <div>Thời gian chương trình: {new Date(campaign.startTime).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })} - {new Date(campaign.endTime).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}</div>
                
              </div>
              <div className="text-sm mt-2">
                {canJoin ? (
                  <span className="text-red-600 font-medium">
                    Kết thúc trong: {SellerCampaignService.getTimeRemainingDetailed(campaign.startTime)}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">Đã hết thời gian đăng ký</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body - flex-1 để đẩy buttons xuống dưới */}
        <div className="p-6 bg-white flex-1 flex flex-col">
          {/* Flash Slots - Horizontal scroll, no wrap */}
          {campaign.flashSlots && campaign.flashSlots.length > 0 && (
            <div className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <ThunderboltOutlined className="text-orange-600 text-base" />
                <span className="text-sm font-bold text-orange-800">Khung giờ Flash Sale</span>
                <Tag color="orange" className="text-xs font-semibold">
                  {campaign.flashSlots.length} khung
                </Tag>
              </div>
              {/* Horizontal scroll container */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100">
                <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                  {campaign.flashSlots.map(slot => (
                    <div
                      key={slot.slotId}
                      className="inline-flex items-center gap-1 bg-white border border-orange-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-900 hover:border-orange-500 hover:shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                    >
                      <span className="text-orange-600">🔥</span>
                      <span>
                        {new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span>
                        {new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {campaign.description && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 text-base mt-0.5">💡</div>
                <p className="text-sm text-gray-700 leading-relaxed m-0 flex-1">
                  {campaign.description}
                </p>
              </div>
            </div>
          )}

          {/* Spacer để đẩy buttons xuống dưới cùng */}
          <div className="flex-1"></div>

          {/* Action Buttons - luôn ở dưới cùng */}
          <div className="flex gap-3 mt-4">{!isJoined ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  disabled={!canJoin}
                  onClick={() => handleJoinCampaign(campaign)}
                  className={`flex-1 h-14 font-bold text-base rounded-xl ${
                    canJoin
                      ? 'shadow-lg hover:shadow-xl hover:scale-105'
                      : ''
                  } transition-all duration-300`}
                  style={
                    canJoin
                      ? {
                          background: 'linear-gradient(135deg, #f97316, #f97316dd)',
                          borderColor: '#f97316',
                        }
                      : {}
                  }
                  icon={canJoin ? <FireOutlined className="text-lg" /> : undefined}
                >
                  {canJoin ? 'Đăng ký tham gia ngay' : 'Không thể đăng ký'}
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={() => navigate(`/seller/dashboard/campaigns/${campaign.id}/products`)}
                  className="h-14 px-8 font-bold text-base rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:text-blue-500 hover:shadow-md transition-all duration-300"
                  icon={<EyeOutlined className="text-lg" />}
                >
                  Xem chi tiết
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(`/seller/dashboard/campaigns/${campaign.id}/products`)}
                className="flex-1 h-14 font-bold text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #f97316dd)',
                  borderColor: '#f97316',
                }}
                icon={<EyeOutlined className="text-lg" />}
              >
                Xem chi tiết chương trình
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-8 px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FireOutlined className="text-4xl" />
            Chiến dịch khuyến mãi
          </h1>
          <p className="text-white text-opacity-90 text-lg">
            Tham gia các chiến dịch để tăng doanh số và tiếp cận nhiều khách hàng hơn
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Stats Cards - Ant Design Style like KYC */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Tổng chiến dịch mở" 
                value={stats.total} 
                valueStyle={{ color: '#f97316' }}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Mega Sale" 
                value={stats.mega} 
                valueStyle={{ color: '#f97316' }}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Flash Sale" 
                value={stats.flash} 
                valueStyle={{ color: '#f97316' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="Đã đăng ký" 
                value={stats.joined} 
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <Input
            placeholder="Tìm kiếm chiến dịch theo tên, mã hoặc mô tả..."
            size="large"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* Tabs - Ant Design Style like KYC */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{
            '--ant-primary-color': '#f97316',
          } as React.CSSProperties}
          className="campaign-tabs"
          items={[
            {
              key: 'all',
              label: (
                <Space>
                  <span>Tất cả</span>
                  <Tag color="orange">{stats.total}</Tag>
                </Space>
              ),
            },
            {
              key: 'mega',
              label: (
                <Space>
                  <FireOutlined />
                  <span>Mega Sale</span>
                  <Tag color="orange">{stats.mega}</Tag>
                </Space>
              ),
            },
            {
              key: 'flash',
              label: (
                <Space>
                  <ThunderboltOutlined />
                  <span>Flash Sale</span>
                  <Tag color="orange">{stats.flash}</Tag>
                </Space>
              ),
            },
            {
              key: 'joined',
              label: (
                <Space>
                  <CheckCircleOutlined />
                  <span>Chương trình đã đăng ký</span>
                  <Tag color="orange">{stats.joined}</Tag>
                </Space>
              ),
            },
          ]}
        />
        
        <style>{`
          .campaign-tabs .ant-tabs-tab {
            color: #1f2937 !important;
          }
          .campaign-tabs .ant-tabs-tab:hover {
            color: #f97316 !important;
          }
          .campaign-tabs .ant-tabs-tab.ant-tabs-tab-active {
            color: #f97316 !important;
          }
          .campaign-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #f97316 !important;
          }
          .campaign-tabs .ant-tabs-ink-bar {
            background: #f97316 !important;
          }
        `}</style>

        {/* Campaign List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" tip={activeTab === 'joined' ? 'Đang tải chiến dịch đã tham gia...' : 'Đang tải các chiến dịch đang mở đăng ký...'} />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Empty
              description={
                <div className="text-center">
                  <p className="text-gray-700 text-xl font-semibold mb-2">
                    {searchText
                      ? ' Không tìm thấy chiến dịch phù hợp'
                      : activeTab === 'joined'
                      ? ' Chưa có chiến dịch nào đã đăng ký'
                      : ' Chưa có chiến dịch nào đang mở đăng ký'}
                  </p>
                  <p className="text-gray-500 text-base mb-4">
                    {searchText
                      ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'
                      : activeTab === 'joined'
                      ? 'Tham gia các chiến dịch để chúng xuất hiện ở đây'
                      : 'Các chiến dịch mới sẽ được hệ thống mở đăng kí và xuất hiện ở đây'}
                  </p>
                  <p className="text-sm text-blue-600 bg-blue-50 inline-block px-4 py-2 rounded-lg">
                    💡 Tip: Theo dõi thường xuyên để không bỏ lỡ cơ hội!
                  </p>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-20 bg-white rounded-xl"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} isJoined={activeTab === 'joined'} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Campaign Modal */}
      <JoinCampaignModal
        visible={isModalVisible}
        campaign={selectedCampaign}
        onClose={handleModalClose}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default SellerCampaignList;
