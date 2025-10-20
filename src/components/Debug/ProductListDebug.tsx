import React, { useState } from 'react';
import { ProductListService } from '../../services/customer/ProductListService';

const ProductListDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing ProductListService.getProducts()...');
      
      // Test 1: No params
      console.log('Test 1: No params');
      const result1 = await ProductListService.getProducts();
      console.log('Result 1:', result1);
      
      // Test 2: With basic params
      console.log('Test 2: With basic params');
      const result2 = await ProductListService.getProducts({
        page: 0,
        size: 5,
        status: 'ACTIVE'
      });
      console.log('Result 2:', result2);
      
      setDebugInfo({
        test1: result1,
        test2: result2,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing direct fetch...');
      
      const url = 'http://localhost:8080/api/products?page=0&size=5&status=ACTIVE';
      console.log('Direct URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch result:', data);
      
      setDebugInfo({
        directFetch: data,
        url: url,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ Direct fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <h3 className="text-lg font-semibold mb-3">🔧 ProductList Debug</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test ProductListService'}
        </button>
        
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Direct Fetch'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
          <div className="font-semibold">Error:</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {debugInfo && (
        <div className="bg-gray-100 p-3 rounded text-sm">
          <div className="font-semibold mb-2">Debug Info:</div>
          <pre className="text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProductListDebug;
