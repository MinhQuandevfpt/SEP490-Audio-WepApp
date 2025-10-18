import React, { useState } from 'react';
import { KycService } from '../../../services/seller/KycService';
import { StoreService } from '../../../services/seller/StoreService';

const SellerDebugPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetStoreId = async () => {
    setLoading(true);
    try {
      const storeId = await KycService.getCurrentStoreId();
      setResult({ success: true, data: storeId, message: 'Store ID retrieved successfully' });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetStoreInfo = async () => {
    setLoading(true);
    try {
      const info = await StoreService.getStoreInfo();
      setResult({ success: true, data: info, message: 'Store info retrieved successfully' });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetStoreStatus = async () => {
    setLoading(true);
    try {
      const status = await StoreService.getStoreStatus();
      setResult({ success: true, data: status, message: 'Store status retrieved successfully' });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetKycStatus = async () => {
    setLoading(true);
    try {
      const kyc = await KycService.getKycStatus();
      setResult({ success: true, data: kyc, message: kyc ? 'KYC found' : 'No KYC (INACTIVE)' });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('seller_store_id');
    localStorage.removeItem('seller_store_info');
    setResult({ success: true, message: 'Cache cleared' });
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('seller_token');
    const storeId = localStorage.getItem('seller_store_id');
    const storeInfo = localStorage.getItem('seller_store_info');
    
    setResult({
      success: true,
      data: {
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : null,
        storeId,
        storeInfo: storeInfo ? JSON.parse(storeInfo) : null
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Seller Debug Tools</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">API Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={testGetStoreId}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Get Store ID
            </button>
            
            <button
              onClick={testGetStoreInfo}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Get Store Info
            </button>
            
            <button
              onClick={testGetStoreStatus}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Get Store Status
            </button>
            
            <button
              onClick={testGetKycStatus}
              disabled={loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              Test Get KYC Status
            </button>
            
            <button
              onClick={checkLocalStorage}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Check LocalStorage
            </button>
            
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">Loading...</p>
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="text-lg font-bold mb-4">Result:</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">💡 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Make sure you are logged in as a seller</li>
            <li>Check LocalStorage to see your token and cached data</li>
            <li>Test Get Store ID to verify the API endpoint works</li>
            <li>Test Get Store Info to see your store details</li>
            <li>Test Get Store Status to check if you can access dashboard</li>
            <li>If you get errors, clear cache and try again</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SellerDebugPage;
