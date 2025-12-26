import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import { UserInfoCard } from '../../../components/ProfilePageComponents/UserInfoCard';
import { OrderHistory } from '../../../components/ProfilePageComponents/OrderHistory';
import { AddressBook } from '../../../components/ProfilePageComponents/AddressBook';
import { ChangePassword } from '../../../components/ProfilePageComponents/ChangePassword';
// import { BankConnect } from '../../../components/ProfilePageComponents/BankConnect'; // Commented out - Bank card feature disabled
import WarrantyComponent from '../../../components/ProfilePageComponents/Warranty/Warranty';
import ReturnHistoryCard from '../../../components/ProfilePageComponents/ReturnHistory/ReturnHistoryCard';
import { ReviewProductPage } from '../ReviewFolder';
import { WalletPage } from '../../../components/CustomerWalletComponents';
import { NotificationPage } from '../../../components/ProfilePageComponents/Notifications';
import { updatePassword } from '../../../data/profiledata';
import { User, Package, MapPinned, Lock, /* CreditCard, */ Shield, Star, Wallet, Bell } from 'lucide-react'; // CreditCard commented out - Bank card feature disabled
import { profileCache } from '../../../services/cache/ProfileCache';
import useCustomerReturns from '../../../hooks/useCustomerReturns';
import { useNavigate } from 'react-router-dom';
import ProfileCustomerService from '../../../services/customer/Profilecustomer';
import type { CustomerProfileResponse } from '../../../types/api';
import { getCustomerId } from '../../../utils/authHelper';

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
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  // Fetch customer profile from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const cid = getCustomerId();
        if (!cid) {
          console.error('Customer ID not found. Please login again.');
          setLoading(false);
          return;
        }

        setCustomerId(cid);
        
        // Fetch profile from API
        const profile = await ProfileCustomerService.getByCustomerId(cid);
        setProfileData(profile);
        
        // Preload addresses and provinces using cache
        try {
          const preloaded = await profileCache.preloadUserData(cid);
          setPreloadedData(preloaded);
        } catch (error) {
          console.error('Preload error:', error);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
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
    // Reload profile from API after password update
    if (customerId) {
      ProfileCustomerService.getByCustomerId(customerId)
        .then(setProfileData)
        .catch(console.error);
    }
  };

  // Bank card management functions - Commented out - Bank card feature disabled
  // const handleAddBankCard = (card: Omit<NonNullable<ProfileData['bankCards']>[0], 'id'>) => {
  //   addBankCard(card);
  //   setData(loadProfileData());
  // };

  // const handleEditBankCard = (id: string, card: Omit<NonNullable<ProfileData['bankCards']>[0], 'id'>) => {
  //   updateBankCard(id, card);
  //   setData(loadProfileData());
  // };

  // const handleDeleteBankCard = (id: string) => {
  //   deleteBankCard(id);
  //   setData(loadProfileData());
  // };

  // const handleSetDefaultBankCard = (id: string) => {
  //   setDefaultBankCard(id);
  //   setData(loadProfileData());
  // };

  const [active, setActive] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    setActive(initialTab);
  }, [initialTab]);

  const navItems = useMemo(
    () => [
      { key: 'info' as const, label: 'Thông tin cá nhân', icon: User },
      { key: 'addresses' as const, label: 'Sổ địa chỉ', icon: MapPinned },
      { key: 'orders' as const, label: 'Đơn hàng', icon: Package },
      { key: 'warranty' as const, label: 'Bảo hành', icon: Shield },
      { key: 'reviews' as const, label: 'Đánh giá sản phẩm', icon: Star },
      { key: 'returns' as const, label: 'Lịch sử hoàn trả', icon: Package },
      { key: 'wallet' as const, label: 'Ví của tôi', icon: Wallet },
      { key: 'notifications' as const, label: 'Thông báo', icon: Bell },
      { key: 'password' as const, label: 'Đổi mật khẩu', icon: Lock },
      // { key: 'bank' as const, label: 'Thẻ ngân hàng', icon: CreditCard }, // Commented out - Bank card feature disabled
    ],
    []
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin...</p>
            </div>
          </div>
        ) : profileData ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left navigation */}
            <aside className="lg:col-span-1">
              <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 min-h-full">
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
            <section className="lg:col-span-4">
              {/* Render all components but hide inactive ones */}
              <div className={active === 'info' ? 'block' : 'hidden'}>
                <UserInfoCard 
                  preloadedData={profileData}
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

              {/* Bank card feature disabled */}
              {/* <div className={active === 'bank' ? 'block' : 'hidden'}>
                <BankConnect 
                  bankCards={data.bankCards || []}
                  onAddCard={handleAddBankCard}
                  onEditCard={handleEditBankCard}
                  onDeleteCard={handleDeleteBankCard}
                  onSetDefault={handleSetDefaultBankCard}
                />
              </div> */}

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
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Không thể tải thông tin tài khoản. Vui lòng thử lại sau.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

