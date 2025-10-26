import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLoginForm } from '../../components/Loginforstorestaffcomponents';
import { showCenterError, showCenterSuccess } from '../../utils/notification';

interface LoginData {
  email: string;
  password: string;
  storeCode: string;
}

const LoginForStaff: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      console.log('Staff Login Data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - replace with real API validation
      if (data.email === 'staff@example.com' && data.password === '123456' && data.storeCode === 'STORE001') {
        // Mock successful login
        localStorage.setItem('staff_token', 'mock_staff_token_12345');
        localStorage.setItem('staff_user', JSON.stringify({
          id: 'staff_001',
          email: data.email,
          name: 'Nguyễn Văn A',
          role: 'STAFF',
          storeCode: data.storeCode,
          storeName: 'AudioShop Store 001',
          permissions: ['ORDER_MANAGEMENT', 'CUSTOMER_SERVICE', 'INVENTORY_VIEW']
        }));
        
        showCenterSuccess('Đăng nhập thành công! Đang chuyển đến dashboard...');
        
        // Navigate to staff dashboard
        setTimeout(() => {
          navigate('/store-staff/dashboard');
        }, 1500);
      } else {
        throw new Error('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email, mật khẩu và mã cửa hàng.');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      showCenterError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <StaffLoginForm 
        onSubmit={handleLogin}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default LoginForStaff;
