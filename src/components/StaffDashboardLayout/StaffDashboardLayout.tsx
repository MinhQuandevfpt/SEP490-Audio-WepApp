import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { Headphones, LogOut, User, LayoutDashboard, ShoppingCart, Users, BarChart2, Settings } from 'lucide-react';
import { StoreStaffAuthService } from '../../services/staff/AuthStaff';

const StaffDashboardLayout: React.FC = () => {
  const handleLogout = () => {
    StoreStaffAuthService.logout();
    window.location.href = '/store-staff/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/store-staff/dashboard" className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Headphones className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">AudioShop Staff Center</h1>
              <p className="text-xs text-gray-500">Bảng điều khiển nhân viên</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="inline-flex items-center text-sm text-gray-700 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-1" />
              Đăng xuất
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-64 z-40 overflow-y-auto hidden md:block">
          <nav className="p-2">
            <ul className="pb-3">
              <li>
                <NavLink
                  to="/store-staff/dashboard"
                  end
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="flex items-center"><LayoutDashboard className="w-5 h-5 mr-2" />Tổng quan</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/store-staff/dashboard/orders"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2" />Đơn hàng</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/store-staff/customers"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="flex items-center"><Users className="w-5 h-5 mr-2" />Khách hàng</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/store-staff/reports"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="flex items-center"><BarChart2 className="w-5 h-5 mr-2" />Báo cáo</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/store-staff/settings"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="flex items-center"><Settings className="w-5 h-5 mr-2" />Cài đặt</span>
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 md:ml-64">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;


