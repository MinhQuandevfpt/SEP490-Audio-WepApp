import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Tag, Button, Tabs, Input, Empty, Spin, Badge, Space
} from 'antd';
import {
  FireOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  EyeOutlined,
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
    const canJoin = SellerCampaignService.canJoinCampaign(
      campaign.status,
      campaign.startTime
    );
    const badgeColor = campaign.badgeColor || (isMegaSale ? '#9333ea' : '#f97316');

    return (
      <Card
        hoverable
        className="mb-6 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0"
        bodyStyle={{ padding: 0 }}
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
                  style={{ background: `linear-gradient(135deg, ${badgeColor}dd, ${badgeColor})` }}
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
                <div className="ml-auto">{getStatusTag(campaign.status)}</div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">{campaign.name}</h3>
              <div className="text-sm text-gray-600 mb-1">Mã: <span className="font-medium text-gray-800">{campaign.code}</span></div>
              <div className="text-sm text-gray-800 font-medium space-y-0.5">
                <div>Thời gian chương trình: {SellerCampaignService.formatDate(campaign.startTime)} - {SellerCampaignService.formatDate(campaign.endTime)}</div>
                {campaign.createdAt && (
                  <div className="text-xs text-gray-500">Tạo lúc: {SellerCampaignService.formatDate(campaign.createdAt)}</div>
                )}
              </div>
              <div className="text-sm mt-2">
                {canJoin ? (
                  <span className="text-red-600 font-medium">
                    Kết thúc trong: {SellerCampaignService.getTimeRemainingDetailed(campaign.startTime)}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">Đã đóng đăng ký</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          {/* Compact spacing after header */}
          <div className="h-2" />

          {/* Flash Slots */}
          {campaign.flashSlots && campaign.flashSlots.length > 0 && (
            <div className="mb-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 border-2 border-orange-200 shadow-sm">
              <div className="flex items-center gap-2 text-base font-bold text-orange-800 mb-4">
                <div className="bg-orange-500 p-2 rounded-lg shadow-md">
                  <ThunderboltOutlined className="text-white text-lg animate-pulse" />
                </div>
                <span>Khung giờ Flash Sale</span>
                <Tag color="orange" className="ml-auto font-bold">
                  {campaign.flashSlots.length} khung
                </Tag>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {campaign.flashSlots.slice(0, 8).map(slot => (
                  <div
                    key={slot.slotId}
                    className="bg-white border-2 border-orange-300 rounded-lg p-3 text-center hover:border-orange-500 hover:shadow-md transition-all"
                  >
                    <div className="text-orange-600 text-xs font-semibold mb-1">
                      🔥 Flash Sale
                    </div>
                    <div className="text-gray-900 font-bold text-sm">
                      {new Date(slot.openTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-gray-500 text-xs">đến</div>
                    <div className="text-gray-900 font-bold text-sm">
                      {new Date(slot.closeTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                {campaign.flashSlots.length > 8 && (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">
                      +{campaign.flashSlots.length - 8} khung
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {campaign.description && (
            <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 text-lg mt-0.5">💡</div>
                <p className="text-sm text-gray-700 leading-relaxed m-0 flex-1">
                  {campaign.description}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
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
                      background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}dd)`,
                      borderColor: badgeColor,
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
              onClick={() => navigate(`/seller/campaigns/${campaign.id}`)}
              className="h-14 px-8 font-bold text-base rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:text-blue-500 hover:shadow-md transition-all duration-300"
              icon={<EyeOutlined className="text-lg" />}
            >
              Xem chi tiết
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
