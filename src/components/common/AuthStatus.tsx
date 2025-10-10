import React from 'react';
import { CustomerAuthService } from '../../services/customer/Authcustomer';

interface AuthStatusProps {
  children: React.ReactNode;
}

// Component để hiển thị thông tin user đã đăng nhập
const AuthStatus: React.FC<AuthStatusProps> = ({ children }) => {
  const isAuthenticated = CustomerAuthService.isAuthenticated();
  const currentUser = CustomerAuthService.getCurrentUser();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* User info overlay - có thể show ở header */}
      <div className="hidden" id="user-info">
        <p>Logged in as: {currentUser?.full_name}</p>
        <p>Email: {currentUser?.email}</p>
        <p>Role: {currentUser?.role}</p>
      </div>
      {children}
    </div>
  );
};

export default AuthStatus;