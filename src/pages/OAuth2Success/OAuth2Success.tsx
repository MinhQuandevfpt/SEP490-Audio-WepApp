import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { showError } from '../../utils/notification';

const OAuth2Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper function to try getting customer profile with different endpoints
  const tryGetCustomerProfile = async (token: string, customerId?: string) => {
    console.log('OAuth2Success - Trying to get customer profile...');
    
    // Try 1: Customers endpoint with customerId (the correct one!)
    if (customerId) {
      try {
        console.log('OAuth2Success - Trying /api/customers/' + customerId);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/customers/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('OAuth2Success - Success with /api/customers/{id}:', result);
          // The response is the customer object directly, not wrapped in data
          return result;
        } else {
          console.log('OAuth2Success - Failed with auth, trying without auth header...');
          // Try without Authorization header (in case it's a public endpoint)
          const responseNoAuth = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/customers/${customerId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*'
            }
          });
          
          if (responseNoAuth.ok) {
            const result = await responseNoAuth.json();
            console.log('OAuth2Success - Success with /api/customers/{id} (no auth):', result);
            return result;
          }
          
          console.log('OAuth2Success - Failed with /api/customers/{id}, status:', response.status, responseNoAuth.status);
        }
      } catch (error) {
        console.log('OAuth2Success - Error with /api/customers/{id}:', error);
      }
    }
    
    // Try 2: Standard profile endpoint (fallback)
    try {
      console.log('OAuth2Success - Trying /api/customer/profile');
      const profile = await CustomerAuthService.getProfile();
      console.log('OAuth2Success - Success with /api/customer/profile:', profile);
      return profile;
    } catch (error) {
      console.log('OAuth2Success - Failed with /api/customer/profile:', error);
    }

    // Try 3: Customer ID endpoint (alternative format)
    if (customerId) {
      try {
        console.log('OAuth2Success - Trying /api/customer/' + customerId);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/customer/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('OAuth2Success - Success with customer ID endpoint:', result);
          return result.data || result;
        }
      } catch (error) {
        console.log('OAuth2Success - Failed with customer ID endpoint:', error);
      }
    }

    throw new Error('All profile endpoints failed');
  };

  useEffect(() => {
    const processOAuth2Success = async () => {
      try {
        // Thử lấy params từ query string - Backend gửi 'accessToken' hoặc 'token'
        let token = searchParams.get('token') || searchParams.get('accessToken');
        let refreshToken = searchParams.get('refreshToken');
        let accountId = searchParams.get('accountId');
        let customerId = searchParams.get('customerId');
        let error = searchParams.get('error');

        // Nếu không có trong query, thử lấy từ hash fragment (#token=xxx)
        if (!token && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          token = hashParams.get('token') || hashParams.get('accessToken');
          refreshToken = hashParams.get('refreshToken');
          accountId = hashParams.get('accountId');
          customerId = hashParams.get('customerId');
          error = hashParams.get('error');
          console.log('OAuth2Success - Found params in hash fragment:', {
            token: token ? 'Present' : 'Missing',
            accountId,
            customerId
          });
        }

        // Debug: Log toàn bộ URL và tất cả parameters
        console.log('OAuth2Success - Current URL:', window.location.href);
        console.log('OAuth2Success - Query params:', Object.fromEntries(searchParams.entries()));
        console.log('OAuth2Success - Hash fragment:', window.location.hash);
        console.log('OAuth2Success - All cookies:', document.cookie);
        console.log('OAuth2Success - Received parameters:', {
          token: token ? `Present (${token.substring(0, 20)}...)` : 'Missing',
          accountId: accountId || 'Missing',
          customerId: customerId || 'Missing',
          error: error || 'None'
        });

        // Thử lấy từ cookie nếu không có trong URL
        if (!token) {
          const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
          const accountIdCookie = document.cookie.match(/(?:^|;\s*)accountId=([^;]+)/);
          const customerIdCookie = document.cookie.match(/(?:^|;\s*)customerId=([^;]+)/);
          
          if (cookieMatch) {
            token = cookieMatch[1];
            accountId = accountIdCookie ? accountIdCookie[1] : accountId;
            customerId = customerIdCookie ? customerIdCookie[1] : customerId;
            console.log('OAuth2Success - Found credentials in cookies!');
          }
        }

        if (error) {
          showError('Đăng nhập Google thất bại: ' + error);
          navigate('/auth/login');
          return;
        }

        if (token && accountId) {
          console.log('OAuth2Success - Processing authentication...');
          
          // Store tokens using RefreshTokenService (handles all formats automatically)
          RefreshTokenService.storeTokens('CUSTOMER', token, refreshToken || '', 'Bearer');

          // Đợi một chút để đảm bảo localStorage được set
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            // Lấy thông tin customer profile thực tế từ database
            console.log('OAuth2Success - Fetching customer profile...');
            
            const customerProfile = await tryGetCustomerProfile(token, customerId || undefined);
            console.log('OAuth2Success - Customer profile loaded successfully:', customerProfile);
            
            // Store customer data using standardized helper
            RefreshTokenService.storeCustomerData({
              email: customerProfile.email,
              full_name: customerProfile.fullName,
              role: 'CUSTOMER',
              accountId: accountId,
              customerId: customerId || customerProfile.id || ''
            });
            
            console.log('✅ OAuth2Success - All data stored (standardized format)');
            
          } catch (profileError) {
            console.error('OAuth2Success - Failed to load customer profile:', profileError);
            
            // Fallback: Lấy thông tin từ JWT token
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('OAuth2Success - Token payload:', payload);
                
                // Lấy email từ token
                const emailFromToken = payload.sub?.split(':')[0] || payload.email || '';
                const nameFromEmail = emailFromToken.split('@')[0] || `User_${accountId.slice(-6)}`;
                
                // Store fallback data using standardized helper
                RefreshTokenService.storeCustomerData({
                  email: emailFromToken,
                  full_name: nameFromEmail,
                  role: payload.role || 'CUSTOMER',
                  accountId: accountId,
                  customerId: customerId || payload.customerId || ''
                });
                
                console.log('OAuth2Success - Saved fallback user profile (from token)');
              }
            } catch (tokenError) {
              console.error('OAuth2Success - Failed to decode token:', tokenError);
              
              // Last fallback: sử dụng accountId một phần làm tên
              RefreshTokenService.storeCustomerData({
                email: '',
                full_name: `User_${accountId.slice(-6)}`,
                role: 'CUSTOMER',
                accountId: accountId,
                customerId: customerId || ''
              });
              
              console.log('OAuth2Success - Saved basic profile (last fallback)');
            }
          }

          // Thêm flag để Header component biết cần update
          localStorage.setItem('authStateChanged', Date.now().toString());

          console.log('OAuth2Success - Authentication completed, redirecting...');
          
          // Chỉ lưu welcome message nếu đây là lần đăng nhập thực sự
          // Tránh show popup khi user vừa logout và bị redirect về OAuth2Success
          const isFromLogout = sessionStorage.getItem('isLoggingOut') === 'true';
          
          if (!isFromLogout) {
            // Lưu thông báo success vào sessionStorage
            const savedUserName = localStorage.getItem('userName') || 'User';
            sessionStorage.setItem('welcomeMessage', JSON.stringify({
              userName: savedUserName,
              showWelcome: true
            }));
          } else {
            // Clear logout flag
            sessionStorage.removeItem('isLoggingOut');
            console.log('OAuth2Success - Skipped welcome message (from logout)');
          }
          
          // Navigate ngay lập tức, không setTimeout
          navigate('/');
          
        } else {
          console.error('OAuth2Success - Missing required parameters');
          console.error('OAuth2Success - Debug info:', {
            hasToken: !!token,
            hasAccountId: !!accountId,
            hasCustomerId: !!customerId,
            url: window.location.href,
            queryParams: Object.fromEntries(searchParams.entries()),
            cookies: document.cookie
          });
          
          // Thông báo lỗi chi tiết hơn
          const missingParams = [];
          if (!token) missingParams.push('token');
          if (!accountId) missingParams.push('accountId');
          
          showError(
            `Không nhận được thông tin xác thực từ server. Thiếu: ${missingParams.join(', ')}`
          );
          
          console.log('OAuth2Success - Redirecting to login in 3 seconds...');
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
        }
      } catch (error) {
        console.error('OAuth2Success - Error processing authentication:', error);
        showError('Lỗi xử lý đăng nhập');
        navigate('/auth/login');
      }
    };

    processOAuth2Success();
  }, [navigate, searchParams]);

  // Không hiện gì cả, chỉ xử lý logic và redirect
  return null;
};

export default OAuth2Success;