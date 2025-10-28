import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLoginForm } from '../../components/Loginforstorestaffcomponents';
import { StoreStaffAuthService } from '../../services/staff/AuthStaff';
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
      console.log('Staff Login Data:', data);
      
      // Call the actual API using StoreStaffAuthService
      const response = await StoreStaffAuthService.login({
        email: data.email,
        password: data.password,
        storeCode: data.storeCode
      });
      
      if (response.status === 200) {
        showCenterSuccess('Đăng nhập thành công! Đang chuyển đến dashboard...');
        
        // Navigate to staff dashboard
        setTimeout(() => {
          navigate('/store-staff/dashboard');
        }, 1500);
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
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
