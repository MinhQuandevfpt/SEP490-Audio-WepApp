import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../../components/Layout';
import UserInfoCard from '../../../components/ProfilePageComponents/UserInfoCard';
import OrderHistory from '../../../components/ProfilePageComponents/OrderHistory';
import AddressBook from '../../../components/ProfilePageComponents/AddressBook';
import { loadProfileData, saveProfileData, type ProfileData } from '../../../data/profiledata';
import { User, Package, MapPinned } from 'lucide-react';

const Profile: React.FC = () => {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    setData(loadProfileData());
  }, []);

  const handleUpdateUser = (next: ProfileData['user']) => {
    if (!data) return;
    const updated: ProfileData = { ...data, user: next };
    setData(updated);
    saveProfileData(updated);
  };

  const [active, setActive] = useState<'info' | 'orders' | 'addresses'>('info');

  const navItems = useMemo(() => ([
    { key: 'info' as const, label: 'Thông tin cá nhân', icon: User },
    { key: 'orders' as const, label: 'Đơn hàng', icon: Package },
    { key: 'addresses' as const, label: 'Sổ địa chỉ', icon: MapPinned },
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
              {active === 'info' && (
                <UserInfoCard 
                  fullName={data.user.fullName} 
                  email={data.user.email} 
                  phone={data.user.phone} 
                  gender={data.user.gender} 
                  dateOfBirth={data.user.dateOfBirth}
                  onUpdate={(next) => handleUpdateUser(next)}
                />
              )}

              {active === 'orders' && (
                <OrderHistory orders={data.orders} />
              )}

              {active === 'addresses' && (
                <AddressBook addresses={data.addresses} />
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

