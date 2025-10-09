import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CustomerAuthService } from '../../services/customer/Authcustomer';

const OAuth2Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

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
        const token = searchParams.get('token');
        const accountId = searchParams.get('accountId');
        const customerId = searchParams.get('customerId');
        const error = searchParams.get('error');

        console.log('OAuth2Success - Received parameters:', {
          token: token ? 'Present' : 'Missing',
          accountId,
          customerId,
          error
        });

        if (error) {
          toast.error('Đăng nhập Google thất bại: ' + error);
          navigate('/auth/login');
          return;
        }

        if (token && accountId) {
          console.log('OAuth2Success - Processing authentication...');
          
          // Lưu token trước để có thể gọi API
          localStorage.setItem('customer_token', token);
          localStorage.setItem('token_type', 'Bearer');
          localStorage.setItem('token', token); // Keep for compatibility
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('accountId', accountId);
          
          if (customerId) {
            localStorage.setItem('customerId', customerId);
          }

          // Đợi một chút để đảm bảo localStorage được set
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            // Lấy thông tin customer profile thực tế từ database
            console.log('OAuth2Success - Fetching customer profile...');
            console.log('OAuth2Success - Token being used:', token);
            console.log('OAuth2Success - CustomerAuthService available:', !!CustomerAuthService);
            console.log('OAuth2Success - Token from localStorage:', localStorage.getItem('customer_token'));
            
            const customerProfile = await tryGetCustomerProfile(token, customerId || undefined);
            console.log('OAuth2Success - Customer profile loaded successfully:', customerProfile);
            console.log('OAuth2Success - Profile fullName:', customerProfile.fullName);
            console.log('OAuth2Success - Profile userName:', customerProfile.userName);
            console.log('OAuth2Success - Profile email:', customerProfile.email);
            
            // Chuyển đổi để phù hợp với format nhất quán 
            // API trả về fullName (camelCase) - đây là tên thật từ database
            const userDataForStorage = {
              email: customerProfile.email,
              full_name: customerProfile.fullName, // Use only full_name (database standard)
              role: 'CUSTOMER', // Default role
              accountId: accountId,
              customerId: customerId || ''
            };
            
            console.log('OAuth2Success - Final user data for storage:', userDataForStorage);
            
            localStorage.setItem('customer_user', JSON.stringify(userDataForStorage));
            localStorage.setItem('userEmail', userDataForStorage.email);
            localStorage.setItem('userName', userDataForStorage.full_name || 'User'); // Use full_name (real name)
            localStorage.setItem('userRole', userDataForStorage.role);
            
            console.log('OAuth2Success - Saved user profile with real fullName:', userDataForStorage);
            
          } catch (profileError) {
            console.error('OAuth2Success - Failed to load customer profile:', profileError);
            console.error('OAuth2Success - Error details:', JSON.stringify(profileError, null, 2));
            
            // Log more details about the error
            if (profileError && typeof profileError === 'object') {
              console.error('OAuth2Success - Error status:', (profileError as any).status);
              console.error('OAuth2Success - Error message:', (profileError as any).message);
            }
            
            // Try alternative approach: decode token to get customer info
            console.log('OAuth2Success - Trying alternative approach with token decode...');
            
            // Fallback: Lấy thông tin từ JWT token
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('OAuth2Success - Token payload:', payload);
                
                // Lấy email từ token
                const emailFromToken = payload.sub?.split(':')[0] || payload.email || '';
                
                // Try to get full name from database by making a direct call
                // For now, let's use a temporary solution
                console.log('OAuth2Success - Using email from token:', emailFromToken);
                
                // Tạo user profile - for now use email name, but we should get it from backend
                const nameFromEmail = emailFromToken.split('@')[0] || `User_${accountId.slice(-6)}`;
                
                const customerProfile = {
                  email: emailFromToken,
                  full_name: nameFromEmail, // TODO: Should get actual full_name from backend
                  fullName: nameFromEmail,  // Keep for compatibility
                  name: nameFromEmail, 
                  role: payload.role || 'CUSTOMER',
                  accountId: accountId,
                  customerId: customerId || ''
                };
                
                localStorage.setItem('customer_user', JSON.stringify(customerProfile));
                localStorage.setItem('userEmail', customerProfile.email);
                localStorage.setItem('userName', customerProfile.full_name || 'User');
                localStorage.setItem('userRole', customerProfile.role);
                
                console.log('OAuth2Success - Saved fallback user profile:', customerProfile);
              }
            } catch (tokenError) {
              console.error('OAuth2Success - Failed to decode token:', tokenError);
              
              // Last fallback: sử dụng accountId một phần làm tên
              const basicProfile = {
                email: '',
                full_name: `User_${accountId.slice(-6)}`,
                fullName: `User_${accountId.slice(-6)}`,
                name: `User_${accountId.slice(-6)}`,
                role: 'CUSTOMER',
                accountId: accountId,
                customerId: customerId || ''
              };
              localStorage.setItem('customer_user', JSON.stringify(basicProfile));
              localStorage.setItem('userName', basicProfile.full_name || 'User');
            }
          }

          // Thêm flag để Header component biết cần update
          localStorage.setItem('authStateChanged', Date.now().toString());

          console.log('OAuth2Success - Authentication completed, redirecting...');
          toast.success('Đăng nhập Google thành công!');
          
          // Đợi một chút để đảm bảo localStorage được lưu
          setTimeout(() => {
            navigate('/');
            setIsProcessing(false);
          }, 500);
          
        } else {
          console.error('OAuth2Success - Missing required parameters');
          toast.error('Không nhận được thông tin xác thực từ server');
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('OAuth2Success - Error processing authentication:', error);
        toast.error('Lỗi xử lý đăng nhập');
        navigate('/auth/login');
      }
    };

    processOAuth2Success();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {isProcessing ? 'Đang hoàn tất đăng nhập...' : 'Đăng nhập thành công!'}
        </h2>
        <p className="text-gray-600">
          {isProcessing ? 'Vui lòng đợi một chút' : 'Đang chuyển hướng...'}
        </p>
      </div>
    </div>
  );
};

export default OAuth2Success;