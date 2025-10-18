import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Layout from '../../../components/Layout';
import { UserInfoCard } from '../../../components/ProfilePageComponents/UserInfoCard';
import { OrderHistory } from '../../../components/ProfilePageComponents/OrderHistory';
import { AddressBook } from '../../../components/ProfilePageComponents/AddressBook';
import { ChangePassword } from '../../../components/ProfilePageComponents/ChangePassword';
import { BankConnect } from '../../../components/ProfilePageComponents/BankConnect';
import { loadProfileData, updatePassword, addBankCard, updateBankCard, deleteBankCard, setDefaultBankCard, type ProfileData } from '../../../data/profiledata';
import { User, Package, MapPinned, Lock, CreditCard } from 'lucide-react';
import { profileCache } from '../../../services/cache/ProfileCache';

const Profile: React.FC = () => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [preloadedData, setPreloadedData] = useState<{
    userProfile?: any;
    addresses?: any[];
    provinces?: any[];
  }>({});

  useEffect(() => {
    setData(loadProfileData());
    
    // Get customer ID for preloading
    const cid = localStorage.getItem('customer_id');
    if (cid) {
      setCustomerId(cid);
      preloadData(cid);
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

  const [active, setActive] = useState<'info' | 'orders' | 'addresses' | 'password' | 'bank'>('info');

  const navItems = useMemo(() => ([
    { key: 'info' as const, label: 'Thông tin cá nhân', icon: User },
    { key: 'orders' as const, label: 'Đơn hàng', icon: Package },
    { key: 'addresses' as const, label: 'Sổ địa chỉ', icon: MapPinned },
    { key: 'password' as const, label: 'Đổi mật khẩu', icon: Lock },
    { key: 'bank' as const, label: 'Thẻ ngân hàng', icon: CreditCard },
  ]), []);

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
                <OrderHistory orders={data.orders} />
              </div>

              <div className={active === 'addresses' ? 'block' : 'hidden'}>
                <AddressBook 
                  preloadedData={preloadedData}
                  customerId={customerId}
                />
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
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

