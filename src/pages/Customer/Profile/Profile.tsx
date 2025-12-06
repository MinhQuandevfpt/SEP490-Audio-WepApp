import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Layout from '../../../components/Layout';
import { UserInfoCard } from '../../../components/ProfilePageComponents/UserInfoCard';
import { OrderHistory } from '../../../components/ProfilePageComponents/OrderHistory';
import { AddressBook } from '../../../components/ProfilePageComponents/AddressBook';
import { ChangePassword } from '../../../components/ProfilePageComponents/ChangePassword';
import { BankConnect } from '../../../components/ProfilePageComponents/BankConnect';
import WarrantyComponent from '../../../components/ProfilePageComponents/Warranty/Warranty';
import ReturnHistoryCard from '../../../components/ProfilePageComponents/ReturnHistory/ReturnHistoryCard';
import { ReviewProductPage } from '../ReviewFolder';
import { WalletPage } from '../../../components/CustomerWalletComponents';
import { NotificationPage } from '../../../components/ProfilePageComponents/Notifications';
import { loadProfileData, updatePassword, addBankCard, updateBankCard, deleteBankCard, setDefaultBankCard, type ProfileData } from '../../../data/profiledata';
import { User, Package, MapPinned, Lock, CreditCard, Shield, Star, Wallet, Bell } from 'lucide-react';
import { profileCache } from '../../../services/cache/ProfileCache';
import useCustomerReturns from '../../../hooks/useCustomerReturns';
import { useNavigate } from 'react-router-dom';

type ProfileTab =
  | 'info'
  | 'orders'
  | 'addresses'
  | 'password'
  | 'bank'
  | 'warranty'
  | 'reviews'
  | 'wallet'
  | 'notifications'
  | 'returns';

interface ProfileProps {
  initialTab?: ProfileTab;
}

const Profile: React.FC<ProfileProps> = ({ initialTab = 'info' }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [preloadedData, setPreloadedData] = useState<{
    userProfile?: any;
    addresses?: any[];
    provinces?: any[];
  }>({});
  const {
    returns,
    total,
    isLoading: returnsLoading,
    error: returnsError,
    reload: reloadReturns,
  } = useCustomerReturns();

  // Chỉ lấy 1 return order mới nhất dựa theo ngày tạo
  const latestReturn = useMemo(() => {
    if (!returns || returns.length === 0) return [];
    
    // Sort theo createdAt desc và lấy phần tử đầu tiên
    const sorted = [...returns].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (mới nhất trước)
    });
    
    return sorted.slice(0, 1); // Chỉ lấy 1 item đầu tiên
  }, [returns]);

  useEffect(() => {
    setData(loadProfileData());
    
    // Get customer ID for preloading - support both 'customerId' and 'customer_id'
    const cid = localStorage.getItem('customerId') || localStorage.getItem('customer_id');
    if (cid) {
      setCustomerId(cid);
      preloadData(cid);
    } else {
      console.error('Customer ID not found. Please login again.');
    }
  }, []);

  // Preload all data when component mounts using cache
  const preloadData = useCallback(async (cid: string) => {
    try {
      const data = await profileCache.preloadUserData(cid);
      setPreloadedData(data);
    } catch (error) {
      console.error('Preload error:', error);
    }
  }, []);

  // TODO: This function is not used yet, will be needed for profile updates
  // const handleUpdateUser = (next: ProfileData['user']) => {
  //   if (!data) return;
  //   const updated: ProfileData = { ...data, user: next };
  //   setData(updated);
  //   saveProfileData(updated);
  // };


  // Password management function
  const handleUpdatePassword = (newPassword: string) => {
    updatePassword(newPassword);
    // Reload data to reflect changes
    setData(loadProfileData());
  };

  // Bank card management functions
  const handleAddBankCard = (card: Omit<NonNullable<ProfileData['bankCards']>[0], 'id'>) => {
    addBankCard(card);
    setData(loadProfileData());
  };

  const handleEditBankCard = (id: string, card: Omit<NonNullable<ProfileData['bankCards']>[0], 'id'>) => {
    updateBankCard(id, card);
    setData(loadProfileData());
  };

  const handleDeleteBankCard = (id: string) => {
    deleteBankCard(id);
    setData(loadProfileData());
  };

  const handleSetDefaultBankCard = (id: string) => {
    setDefaultBankCard(id);
    setData(loadProfileData());
  };

  const [active, setActive] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);

  const navItems = useMemo(
    () => [
      { key: 'info' as const, label: 'Thông tin cá nhân', icon: User },
      { key: 'orders' as const, label: 'Đơn hàng', icon: Package },
      { key: 'addresses' as const, label: 'Sổ địa chỉ', icon: MapPinned },
      { key: 'warranty' as const, label: 'Bảo hành', icon: Shield },
      { key: 'reviews' as const, label: 'Đánh giá sản phẩm', icon: Star },
      { key: 'wallet' as const, label: 'Ví nền tảng', icon: Wallet },
      { key: 'notifications' as const, label: 'Thông báo', icon: Bell },
      { key: 'password' as const, label: 'Đổi mật khẩu', icon: Lock },
      { key: 'bank' as const, label: 'Thẻ ngân hàng', icon: CreditCard },
      { key: 'returns' as const, label: 'Lịch sử hoàn trả', icon: Package },
    ],
    []
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left navigation */}
            <aside className="lg:col-span-1">
              <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                {navItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      active === key
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active === key ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Right content */}
            <section className="lg:col-span-2 space-y-6">
              {/* Render all components but hide inactive ones */}
              <div className={active === 'info' ? 'block' : 'hidden'}>
                <UserInfoCard 
                  preloadedData={preloadedData.userProfile}
                  customerId={customerId}
                />
              </div>

              <div className={active === 'orders' ? 'block' : 'hidden'}>
                <OrderHistory />
              </div>

              <div className={active === 'addresses' ? 'block' : 'hidden'}>
                <AddressBook 
                  preloadedData={preloadedData}
                  customerId={customerId}
                />
              </div>

              <div className={active === 'warranty' ? 'block' : 'hidden'}>
                <WarrantyComponent />
              </div>

              <div className={active === 'returns' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  <ReturnHistoryCard
                    data={latestReturn[0] || null}
                    isLoading={returnsLoading}
                    error={returnsError}
                    onReload={reloadReturns}
                  />
                  {total > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/returns')}
                        className="px-4 py-2 rounded-lg border border-orange-500 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors"
                      >
                        Xem đầy đủ lịch sử hoàn trả ({total} yêu cầu)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={active === 'password' ? 'block' : 'hidden'}>
                <ChangePassword 
                  onUpdatePassword={handleUpdatePassword}
                />
              </div>

              <div className={active === 'bank' ? 'block' : 'hidden'}>
                <BankConnect 
                  bankCards={data.bankCards || []}
                  onAddCard={handleAddBankCard}
                  onEditCard={handleEditBankCard}
                  onDeleteCard={handleDeleteBankCard}
                  onSetDefault={handleSetDefaultBankCard}
                />
              </div>

              <div className={active === 'reviews' ? 'block' : 'hidden'}>
                <ReviewProductPage />
              </div>

              <div className={active === 'wallet' ? 'block' : 'hidden'}>
                <WalletPage customerId={customerId} />
              </div>

              <div className={active === 'notifications' ? 'block' : 'hidden'}>
                <NotificationPage />
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

