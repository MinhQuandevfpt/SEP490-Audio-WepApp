import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import CustomerAuthService from '../../../services/customer/Authcustomer';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const parseToken = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  }, [location.search]);

  useEffect(() => {
    const t = parseToken();
    setToken(t);
    if (!t) {
      setStatus('error');
      setMessage('Thiếu token reset mật khẩu. Vui lòng kiểm tra lại đường dẫn trong email.');
    }
  }, [parseToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showCenterError('Thiếu token reset mật khẩu.', 'Lỗi');
      return;
    }
    if (!newPassword.trim()) {
      showCenterError('Vui lòng nhập mật khẩu mới.', 'Thiếu thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      showCenterError('Mật khẩu xác nhận không khớp.', 'Lỗi');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await CustomerAuthService.resetPassword(token, newPassword.trim());
      if (res?.status === 200 || res?.status === 0) {
        setStatus('success');
        setMessage(res.message || 'Đặt lại mật khẩu thành công.');
        showCenterSuccess(res.message || 'Đặt lại mật khẩu thành công.', 'Thành công');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } else {
        setStatus('error');
        setMessage(res?.message || 'Đặt lại mật khẩu thất bại.');
        showCenterError(res?.message || 'Đặt lại mật khẩu thất bại.', 'Lỗi');
      }
    } catch (error: any) {
      setStatus('error');
      const msg = error?.message || 'Đặt lại mật khẩu thất bại.';
      setMessage(msg);
      showCenterError(msg, 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = () => {
    if (status === 'success') return <CheckCircle className="w-10 h-10 text-green-600" />;
    if (status === 'error') return <XCircle className="w-10 h-10 text-red-500" />;
    if (isSubmitting) return <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />;
    return <Lock className="w-10 h-10 text-orange-500" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full border border-gray-100">
        <div className="flex justify-center mb-4">{renderIcon()}</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Đặt lại mật khẩu</h1>
        {message && (
          <p className="text-sm text-center mb-4 text-gray-600">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập mật khẩu mới"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/auth/login')}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Quay về đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

