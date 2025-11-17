import { useCallback, useEffect, useState } from 'react';
import { FinanceService } from '../services/seller/FinanceService';
import type { WalletTransaction, WalletTransactionFilterParams, TransactionType, WalletInfo } from '../types/seller';

export interface UseFinanceFilters {
  walletId?: string;
  from?: string; // ISO format date
  to?: string; // ISO format date
  type?: TransactionType;
  transactionId?: string;
}

export const useFinance = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet Info
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<UseFinanceFilters>({});
  const [sort, setSort] = useState<string>('createdAt:desc');

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: WalletTransactionFilterParams = {
        ...filters,
        page,
        size: pageSize,
        sort,
      };
      
      const data = await FinanceService.filterTransactions(params);
      
      if (data) {
        setTransactions(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setTransactions([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách giao dịch');
      setTransactions([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize, sort]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset to page 0 when filters or pageSize changes
  useEffect(() => {
    setPage(0);
  }, [filters, pageSize]);

  const updateFilters = useCallback((newFilters: Partial<UseFinanceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(0);
  }, []);

  // Load wallet info
  const loadWalletInfo = useCallback(async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const data = await FinanceService.getWalletInfo();
      if (data) {
        setWalletInfo(data);
      } else {
        setWalletInfo(null);
      }
    } catch (e: any) {
      setWalletError(e?.message || 'Không thể tải thông tin ví');
      setWalletInfo(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  const refresh = useCallback(() => {
    loadTransactions();
    loadWalletInfo();
  }, [loadTransactions, loadWalletInfo]);

  return {
    // Data
    transactions,
    isLoading,
    error,
    
    // Wallet Info
    walletInfo,
    walletLoading,
    walletError,
    
    // Pagination
    page,
    pageSize,
    totalElements,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Sort
    sort,
    handleSortChange,
    
    // Actions
    refresh,
    loadWalletInfo,
  };
};

export default useFinance;

