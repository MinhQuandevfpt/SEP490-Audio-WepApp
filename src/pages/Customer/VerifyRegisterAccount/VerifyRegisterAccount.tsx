import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import CustomerAuthService from '../../../services/customer/Authcustomer';

type VerifyStatus = 'loading' | 'success' | 'invalid' | 'expired' | 'already' | 'error' | 'no-token';

const VerifyRegisterAccount: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState<string>('Đang xác nhận tài khoản...');
  const hasTriggeredRef = useRef(false);

  const parseToken = useCallback((): string | null => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  }, [location.search]);

  const handleRedirectLogin = useCallback(() => {
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);
  }, [navigate]);

  const verify = useCallback(
    async (token: string) => {
      try {
        setStatus('loading');
        setMessage('Đang xác nhận tài khoản...');

        const res = await CustomerAuthService.verifyRegisterAccount(token);
        const resStatus = (res as any)?.status;
        const resMessageRaw = (res as any)?.message || '';
        const resMessage = resMessageRaw.toLowerCase();

        // BE trả 200 khi thành công
        if (resStatus === 200) {
          setStatus('success');
          setMessage(resMessageRaw || 'Xác nhận thành công! Đang chuyển sang đăng nhập...');
          handleRedirectLogin();
          return;
        }

        if (resStatus === 400 && resMessage.includes('đã được kích hoạt')) {
          setStatus('already');
          setMessage(resMessageRaw || 'Tài khoản đã được xác nhận trước đó.');
          handleRedirectLogin();
          return;
        }

        if (resMessage.includes('đã được xác nhận') || resMessage.includes('đã được kích hoạt') || resMessage.includes('already') || resMessage.includes('verified')) {
          setStatus('already');
          setMessage(resMessageRaw || 'Tài khoản đã được xác nhận trước đó.');
          handleRedirectLogin();
          return;
        }

        if (resMessage.includes('expired') || resMessage.includes('hết hạn')) {
          setStatus('expired');
          setMessage(resMessageRaw || 'Link xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email.');
          return;
        }

        if (resMessage.includes('invalid') || resMessage.includes('not valid') || resMessage.includes('wrong')) {
          setStatus('invalid');
          setMessage(resMessageRaw || 'Link xác nhận không hợp lệ. Vui lòng kiểm tra lại hoặc yêu cầu gửi lại email.');
          return;
        }

        setStatus('error');
        setMessage(resMessageRaw || 'Không xác định được kết quả. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
      } catch (error: any) {
        const errStatus = error?.status || (error?.response?.status ?? null);
        const errMsgRaw = error?.message || error?.response?.message || '';
        const errMsg = errMsgRaw.toLowerCase?.() || '';

        if (errMsg.includes('đã được xác nhận') || errMsg.includes('đã được kích hoạt') || errMsg.includes('already') || errMsg.includes('verified')) {
          setStatus('already');
          setMessage(errMsgRaw || 'Tài khoản đã được xác nhận trước đó.');
          handleRedirectLogin();
          return;
        }

        if (errMsg.includes('expired') || errMsg.includes('hết hạn')) {
          setStatus('expired');
          setMessage(errMsgRaw || 'Link xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email.');
        } else if (errMsg.includes('invalid') || errMsg.includes('not valid') || errMsg.includes('wrong')) {
          setStatus('invalid');
          setMessage(errMsgRaw || 'Link xác nhận không hợp lệ. Vui lòng kiểm tra lại hoặc yêu cầu gửi lại email.');
        } else if (errStatus === 400 && errMsgRaw) {
          // Nếu BE trả 400 kèm message cụ thể, hiển thị trực tiếp để người dùng biết lý do
          setStatus('error');
          setMessage(errMsgRaw);
        } else {
          setStatus('error');
          setMessage(errMsgRaw || 'Xác nhận thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
        }
      }
    },
    [handleRedirectLogin]
  );

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    const token = parseToken();
    if (!token) {
      setStatus('no-token');
      setMessage('Thiếu token xác nhận. Vui lòng kiểm tra lại đường dẫn trong email.');
      return;
    }
    hasTriggeredRef.current = true;
    verify(token);
  }, [parseToken, verify]);

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'invalid':
      case 'expired':
      case 'error':
      case 'no-token':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'already':
        return <Info className="w-12 h-12 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full text-center border border-gray-100">
        <div className="flex justify-center mb-4">{renderIcon()}</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận tài khoản</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'loading' && (
          <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát...</p>
        )}

        {(status === 'invalid' || status === 'expired' || status === 'error' || status === 'no-token') && (
          <div className="space-y-3">
            <button
              onClick={() => {
                const token = parseToken();
                if (token) {
                  verify(token);
                }
              }}
              className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Quay về đăng nhập
            </button>
          </div>
        )}

        {status === 'already' && (
          <button
            onClick={() => navigate('/auth/login')}
            className="mt-3 w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
          >
            Đi đến đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyRegisterAccount;

