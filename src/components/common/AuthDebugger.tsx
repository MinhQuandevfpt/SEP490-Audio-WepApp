import React, { useState, useEffect } from 'react';

const AuthDebugger: React.FC = () => {
  const [authData, setAuthData] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateAuthData = () => {
      const data = {
        CUSTOMER_token: localStorage.getItem('CUSTOMER_token'),
        CUSTOMER_refresh_token: localStorage.getItem('CUSTOMER_refresh_token'),
        customer_user: localStorage.getItem('customer_user'),
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        accountId: localStorage.getItem('accountId'),
        customerId: localStorage.getItem('customerId'),
      };
      setAuthData(data);
    };

    updateAuthData();
    
    // Update every second to catch changes
    const interval = setInterval(updateAuthData, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Auth Debug (Ctrl+Shift+D to hide)</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        {Object.entries(authData).map(([key, value]) => (
          <div key={key} className="break-all">
            <span className="text-yellow-400">{key}:</span>{' '}
            <span className="text-green-300">
              {typeof value === 'string' && value.length > 50 
                ? `${value.substring(0, 50)}...` 
                : String(value || 'null')}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 space-y-1">
        <div className="text-blue-300">
          customer_user parsed:
        </div>
        <pre className="text-xs text-green-200 bg-gray-800 p-2 rounded overflow-auto max-h-32">
          {authData.customer_user ? 
            JSON.stringify(JSON.parse(authData.customer_user), null, 2) : 
            'null'
          }
        </pre>
      </div>
    </div>
  );
};

export default AuthDebugger;