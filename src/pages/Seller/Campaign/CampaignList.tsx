import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Tag, Button, Tabs, Input, Empty, Spin, Badge, Space
} from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { SellerCampaignService } from '../../../services/seller/CampaignService';
import type { CampaignForSeller } from '../../../types/seller';
import { showTikiNotification } from '../../../utils/notification';
import JoinCampaignModal from './JoinCampaignModal';

const { TabPane } = Tabs;
const { Search } = Input;

const SellerCampaignList: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignForSeller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignForSeller | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

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

  // Filter campaigns based on search only (all are ONOPEN already)
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.code.toLowerCase().includes(searchText.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by tab (type)
    if (activeTab === 'mega') {
      filtered = filtered.filter(c => c.type === 'MEGA_SALE');
    } else if (activeTab === 'flash') {
      filtered = filtered.filter(c => c.type === 'FAST_SALE');
    }

    return filtered;
  }, [campaigns, activeTab, searchText]);

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      mega: campaigns.filter(c => c.type === 'MEGA_SALE').length,
      flash: campaigns.filter(c => c.type === 'FAST_SALE').length,
    }),
    [campaigns]
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
    // Refresh campaign list after successful join
    fetchCampaigns();
  };

  const CampaignCard = ({ campaign }: { campaign: CampaignForSeller }) => {
    const isMegaSale = campaign.type === 'MEGA_SALE';
    const canJoin = SellerCampaignService.canJoinCampaign(campaign.status);
    const badgeColor = campaign.badgeColor || (isMegaSale ? '#9333ea' : '#f97316');

    return (
      <Card
        hoverable
        className="mb-4 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
        bodyStyle={{ padding: 0 }}
        style={{ 
          border: canJoin ? `2px solid ${badgeColor}` : '1px solid #e5e7eb',
        }}
      >
        {/* Header with custom gradient from badge color */}
        <div
          className="relative p-6"
          style={{
            background: `linear-gradient(135deg, ${badgeColor}dd, ${badgeColor})`
          }}
        >
          {/* Badge Icon */}
          {campaign.badgeIconUrl && (
            <div className="absolute top-4 right-4">
              <img 
                src={campaign.badgeIconUrl} 
                alt={campaign.badgeLabel}
                className="w-16 h-16 object-contain opacity-90"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-start justify-between pr-20">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  {isMegaSale ? (
                    <FireOutlined className="text-2xl text-white" />
                  ) : (
                    <ThunderboltOutlined className="text-2xl text-white animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white m-0 drop-shadow-lg">
                    {campaign.name}
                  </h3>
                  {campaign.badgeLabel && (
                    <div className="flex items-center gap-2 mt-1">
                      <Tag 
                        className="bg-white bg-opacity-25 text-white border-white border-opacity-50 text-xs font-semibold"
                      >
                        {campaign.badgeLabel}
                      </Tag>
                      <span className="text-white text-opacity-80 text-xs font-medium">
                        #{campaign.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 right-4">
            {getStatusTag(campaign.status)}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          {/* Time Info with Icons */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CalendarOutlined className="text-blue-500 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Bắt đầu</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {SellerCampaignService.formatDate(campaign.startTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarOutlined className="text-red-500 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Kết thúc</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {SellerCampaignService.formatDate(campaign.endTime)}
                  </div>
                </div>
              </div>
            </div>
            
            {canJoin && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-orange-600 font-semibold">
                <ClockCircleOutlined className="animate-pulse" />
                <span className="text-sm">
                  {SellerCampaignService.getTimeRemaining(campaign.endTime)}
                </span>
              </div>
            )}
          </div>

          {/* Flash Slots */}
          {campaign.flashSlots && campaign.flashSlots.length > 0 && (
            <div className="mb-4 bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-800 mb-3">
                <ThunderboltOutlined className="text-lg" />
                <span>Khung giờ Flash Sale ({campaign.flashSlots.length} khung)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {campaign.flashSlots.slice(0, 4).map(slot => (
                  <Tag
                    key={slot.slotId}
                    color="orange"
                    className="text-xs font-medium px-3 py-1 rounded-full"
                  >
                    🔥 {new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Tag>
                ))}
                {campaign.flashSlots.length > 4 && (
                  <Tag className="text-xs px-3 py-1 bg-gray-100 border-gray-300 rounded-full">
                    +{campaign.flashSlots.length - 4} khung khác
                  </Tag>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {campaign.description && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 line-clamp-2 m-0">
                💡 {campaign.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              type="primary"
              size="large"
              disabled={!canJoin}
              onClick={() => handleJoinCampaign(campaign)}
              className={`flex-1 h-12 font-semibold text-base rounded-lg ${
                canJoin
                  ? 'shadow-lg hover:shadow-xl'
                  : ''
              }`}
              style={
                canJoin
                  ? {
                      background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}dd)`,
                      borderColor: badgeColor,
                    }
                  : {}
              }
              icon={canJoin ? <FireOutlined /> : undefined}
            >
              {canJoin ? 'Đăng ký ngay' : 'Không thể đăng ký'}
            </Button>
            <Button
              type="default"
              size="large"
              onClick={() => navigate(`/seller/campaigns/${campaign.id}`)}
              className="h-12 px-6 font-medium rounded-lg border-2 hover:border-blue-500 hover:text-blue-500"
            >
              Chi tiết
            </Button>
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
        {/* Stats Cards - Simplified for ONOPEN only */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Tổng chiến dịch mở</div>
                <div className="text-4xl font-bold">{stats.total}</div>
                <div className="text-xs opacity-75 mt-1">Đang mở đăng ký</div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <FireOutlined className="text-4xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Mega Sale</div>
                <div className="text-4xl font-bold">{stats.mega}</div>
                <div className="text-xs opacity-75 mt-1">Chiến dịch lớn</div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <FireOutlined className="text-4xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Flash Sale</div>
                <div className="text-4xl font-bold">{stats.flash}</div>
                <div className="text-xs opacity-75 mt-1">Giờ vàng giá sốc</div>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <ThunderboltOutlined className="text-4xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <Search
            placeholder="Tìm kiếm chiến dịch theo tên, mã hoặc mô tả..."
            size="large"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            className="text-lg"
          />
        </div>

        {/* Tabs - Only Type filter needed */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="bg-white rounded-xl shadow-sm px-4"
        >
          <TabPane
            tab={
              <Space>
                <span>Tất cả</span>
                <Badge
                  count={stats.total}
                  showZero
                  style={{ backgroundColor: '#52c41a' }}
                />
              </Space>
            }
            key="all"
          />
          <TabPane
            tab={
              <Space>
                <FireOutlined />
                <span>Mega Sale</span>
                <Badge count={stats.mega} />
              </Space>
            }
            key="mega"
          />
          <TabPane
            tab={
              <Space>
                <ThunderboltOutlined />
                <span>Flash Sale</span>
                <Badge count={stats.flash} />
              </Space>
            }
            key="flash"
          />
        </Tabs>

        {/* Campaign List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" tip="Đang tải các chiến dịch đang mở đăng ký..." />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Empty
              description={
                <div className="text-center">
                  <p className="text-gray-700 text-xl font-semibold mb-2">
                    {searchText
                      ? '🔍 Không tìm thấy chiến dịch phù hợp'
                      : '🎉 Chưa có chiến dịch nào đang mở đăng ký'}
                  </p>
                  <p className="text-gray-500 text-base mb-4">
                    {searchText
                      ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'
                      : 'Các chiến dịch mới sẽ được admin mở và xuất hiện ở đây'}
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
                <CampaignCard key={campaign.id} campaign={campaign} />
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
