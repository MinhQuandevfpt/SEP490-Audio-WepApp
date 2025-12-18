import { useCallback, useEffect, useState } from 'react';
import { FinanceService } from '../services/seller/FinanceService';
import type { 
  WalletTransaction, 
  WalletTransactionFilterParams, 
  TransactionType,
  WalletOverview
} from '../types/seller';

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
  
  // Wallet Overview
  const [walletOverview, setWalletOverview] = useState<WalletOverview | null>(null);
  const [walletOverviewLoading, setWalletOverviewLoading] = useState(false);
  const [walletOverviewError, setWalletOverviewError] = useState<string | null>(null);
  
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

  // Load wallet overview
  const loadWalletOverview = useCallback(async () => {
    try {
      setWalletOverviewLoading(true);
      setWalletOverviewError(null);
      const data = await FinanceService.getWalletOverview();
      if (data) {
        setWalletOverview(data);
      } else {
        setWalletOverview(null);
      }
    } catch (e: any) {
      setWalletOverviewError(e?.message || 'Không thể tải tổng quan ví');
      setWalletOverview(null);
    } finally {
      setWalletOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletOverview();
  }, [loadWalletOverview]);

  const refresh = useCallback(() => {
    loadTransactions();
    loadWalletOverview();
  }, [loadTransactions, loadWalletOverview]);

  return {
    // Data
    transactions,
    isLoading,
    error,
    
    // Wallet Overview
    walletOverview,
    walletOverviewLoading,
    walletOverviewError,
    
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
    loadWalletOverview,
  };
};

export default useFinance;

