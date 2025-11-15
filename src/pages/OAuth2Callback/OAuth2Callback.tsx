import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RefreshTokenService } from '../../services/RefreshTokenService';

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Route này chỉ dùng cho fallback hoặc trường hợp backend redirect sai
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Đăng nhập Google thất bại: ' + error);
      navigate('/auth/login');
      return;
    }

    if (token) {
      // Store tokens using RefreshTokenService (handles all formats automatically)
      RefreshTokenService.storeTokens('CUSTOMER', token, refreshToken || '', 'Bearer');
      
      toast.success('Đăng nhập Google thành công!');
      navigate('/');
    } else {
      // Không có token, có thể backend đã redirect về route khác
      toast.info('Đang chuyển hướng...');
      navigate('/auth/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;