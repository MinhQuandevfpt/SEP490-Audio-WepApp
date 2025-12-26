import React, { useState, useEffect, useRef } from 'react';
import { Wallet, RefreshCw, Clock, TrendingUp, DollarSign, AlertCircle, Building2, Package, Filter, X, Search, ChevronDown } from 'lucide-react';
import { PlatformWalletOverviewService } from '../../../services/admin/PlatformWalletOverviewService';
import { PlatformWalletService } from '../../../services/admin/PlatformWalletService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { PlatformWalletOverview } from '../../../types/platform-wallet';
import type { GhnFlatDebtSummary } from '../../../types/admin';
import { showCenterError } from '../../../utils/notification';
import PlatformTransactionList from '../../../components/PlatformWalletSection/PlatformTransactionList';

const PlatformWalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<PlatformWalletOverview | null>(null);
  const [debtSummary, setDebtSummary] = useState<GhnFlatDebtSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Store selection states
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStoreName, setSelectedStoreName] = useState('Tất cả cửa hàng');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
    loadStores();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStores = async () => {
    setIsLoadingStores(true);
    try {
      const storesList = await AdminStoreService.getAllStores(0, 1000);
      setStores(storesList.map(store => ({
        id: store.id,
        name: store.name || `Cửa hàng ${store.id.slice(0, 8)}`
      })));
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletOverview, debtData] = await Promise.all([
        PlatformWalletOverviewService.getOverview(),
        PlatformWalletService.getGhnFlatDebtSummary(selectedStoreId || undefined)
      ]);
      setWalletData(walletOverview);
      setDebtSummary(debtData);
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải dữ liệu ví. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadDebtSummary = async () => {
    setIsLoading(true);
    try {
      const debtData = await PlatformWalletService.getGhnFlatDebtSummary(selectedStoreId || undefined);
      setDebtSummary(debtData);
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải dữ liệu công nợ. Vui lòng thử lại.',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreSelect = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleClearStore = () => {
    setSelectedStoreId('');
    setSelectedStoreName('Tất cả cửa hàng');
    setSearchQuery('');
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ví Hệ Thống</h1>
          <p className="text-gray-600 mt-1">Tổng quan số dư ví nền tảng</p>
        </div>
        <button
          onClick={loadWalletData}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {isLoading && !walletData ? (
        // Loading State
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-pulse">
            <div className="h-48 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : walletData ? (
        // Data Loaded
        <>
          {/* Main Cash Balance Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-2xl shadow-2xl text-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm opacity-90 font-medium">Số dư ví nền tảng</p>
                  <h2 className="text-4xl font-bold mt-1">
                    {formatCurrency(walletData.cashBalance)}
                  </h2>
                </div>
              </div>

            </div>
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white border-opacity-20">
              <Clock className="w-4 h-4 opacity-75" />
              <p className="text-xs opacity-75">
                Cập nhật lần cuối: <span className="font-semibold">{formatDateTime(walletData.lastUpdatedAt)}</span>
              </p>
            </div>
          </div>

          {/* GHN/Flat Debt Summary Section */}
          {debtSummary && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-4 mb-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">TỔNG TIỀN NỢ GHN CẦN TRẢ</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Phạm vi: <span className="font-medium">{debtSummary.scope === 'ALL_SYSTEM' ? 'Toàn hệ thống' : `Cửa hàng: ${selectedStoreName}`}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={loadDebtSummary}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </button>
                </div>
                
                {/* Store Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Custom Searchable Select */}
                  <div className="relative flex-1" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{selectedStoreName}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
                        {/* Search Box */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm cửa hàng..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        {/* Store List */}
                        <div className="max-h-60 overflow-y-auto">
                          {/* All Stores Option */}
                          <button
                            onClick={() => handleStoreSelect('', 'Tất cả cửa hàng')}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                              selectedStoreId === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>Tất cả cửa hàng</span>
                            </div>
                          </button>
                          
                          {/* Loading State */}
                          {isLoadingStores && (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                              Đang tải...
                            </div>
                          )}
                          
                          {/* Store Options */}
                          {!isLoadingStores && filteredStores.length > 0 ? (
                            filteredStores.map((store) => (
                              <button
                                key={store.id}
                                onClick={() => handleStoreSelect(store.id, store.name)}
                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                                  selectedStoreId === store.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">{store.name}</span>
                                  <span className="text-xs text-gray-500">{store.id}</span>
                                </div>
                              </button>
                            ))
                          ) : !isLoadingStores ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                              Không tìm thấy cửa hàng
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Clear & Apply Buttons */}
                  <div className="flex items-center gap-2">
                    {selectedStoreId && (
                      <button
                        onClick={handleClearStore}
                        className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Xóa
                      </button>
                    )}
                    <button
                      onClick={loadDebtSummary}
                      disabled={isLoading}
                      className="inline-flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Flat nợ GHN */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tổng Tiền Nợ GHN</span>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-700 mb-1">
                    {formatCurrency(debtSummary.flatDebtToGHN)}
                  </p>
                  <p className="text-xs text-red-600 font-medium">Tổng công nợ với GHN</p>
                </div>

                {/* Khách đã trả */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tổng tiền Khách đã trả</span>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-1">
                    {formatCurrency(debtSummary.customerPaidTotal)}
                  </p>
                  <p className="text-xs text-green-600 font-medium">Phí ship khách thanh toán</p>
                </div>

                {/* Nợ từ ORDER */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tổng tiền shop nợ</span>
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-1">
                    {formatCurrency(debtSummary.storeOrderDebtToFlat.total)}
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-200 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="font-semibold text-green-700">{formatCurrency(debtSummary.storeOrderDebtToFlat.paid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Còn nợ:</span>
                      <span className="font-semibold text-orange-700">{formatCurrency(debtSummary.storeOrderDebtToFlat.outstanding)}</span>
                    </div>
                  </div>
                </div>

                {/* Nợ phí hoàn */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Nợ phí hoàn</span>
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700 mb-1">
                    {formatCurrency(debtSummary.returnFeeDebtToFlat.total)}
                  </p>
                  <div className="mt-3 pt-3 border-t border-purple-200 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="font-semibold text-green-700">{formatCurrency(debtSummary.returnFeeDebtToFlat.paid)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Còn nợ:</span>
                      <span className="font-semibold text-orange-700">{formatCurrency(debtSummary.returnFeeDebtToFlat.outstanding)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card - Tổng kết các khoản */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Tổng kết các khoản
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Khách đã trả */}
                  <div className="bg-white bg-opacity-80 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">+ Khách đã trả</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(debtSummary.customerPaidTotal)}</p>
                  </div>
                  
                  {/* Nợ từ Order */}
                  <div className="bg-white bg-opacity-80 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">+ Shop nợ</p>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(debtSummary.storeOrderDebtToFlat.total)}</p>
                  </div>
                  
                  {/* Nợ phí hoàn */}
                  <div className="bg-white bg-opacity-80 rounded-lg p-4 border border-purple-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">+ Nợ phí hoàn</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(debtSummary.returnFeeDebtToFlat.total)}</p>
                  </div>
                </div>
                
                {/* Tổng cộng */}
                <div className="mt-4 pt-4 border-t-2 border-indigo-300">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-indigo-900 uppercase tracking-wide">
                      = Tổng tiền nền tảng thu
                    </span>
                    <span className="text-3xl font-black text-red-700">
                      {formatCurrency(debtSummary.flatDebtToGHN)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-right italic">
                    {formatCurrency(debtSummary.customerPaidTotal)} + {formatCurrency(debtSummary.storeOrderDebtToFlat.total)} + {formatCurrency(debtSummary.returnFeeDebtToFlat.total)} = {formatCurrency(debtSummary.flatDebtToGHN)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction List Section */}
          <PlatformTransactionList />
        </>
      ) : (
        // Empty State
        <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có dữ liệu
            </h3>
            <p className="text-gray-500">
              Nhấn <strong>"Làm mới"</strong> để tải thông tin ví
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformWalletPage;
