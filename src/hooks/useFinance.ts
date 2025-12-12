import { useCallback, useEffect, useState } from 'react';
import { FinanceService } from '../services/seller/FinanceService';
import type { 
  WalletTransaction, 
  WalletTransactionFilterParams, 
  TransactionType, 
  WalletInfo,
  PayoutSummary,
  PayoutItem,
  PayoutBucket
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
  
  // Wallet Info
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Payout Summary
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [payoutSummaryLoading, setPayoutSummaryLoading] = useState(false);
  const [payoutSummaryError, setPayoutSummaryError] = useState<string | null>(null);

  // Payout Items
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [payoutItemsLoading, setPayoutItemsLoading] = useState(false);
  const [payoutItemsError, setPayoutItemsError] = useState<string | null>(null);
  const [payoutBucket, setPayoutBucket] = useState<PayoutBucket>('ESTIMATED');
  const [payoutItemsPage, setPayoutItemsPage] = useState(0);
  const [payoutItemsPageSize, setPayoutItemsPageSize] = useState(20);
  const [payoutItemsTotal, setPayoutItemsTotal] = useState(0);
  const [payoutItemsTotalPages, setPayoutItemsTotalPages] = useState(0);
  
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

  // Load payout summary
  const loadPayoutSummary = useCallback(async () => {
    try {
      setPayoutSummaryLoading(true);
      setPayoutSummaryError(null);
      const data = await FinanceService.getPayoutSummary();
      if (data) {
        setPayoutSummary(data);
      } else {
        setPayoutSummary(null);
      }
    } catch (e: any) {
      setPayoutSummaryError(e?.message || 'Không thể tải tổng quan payout');
      setPayoutSummary(null);
    } finally {
      setPayoutSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayoutSummary();
  }, [loadPayoutSummary]);

  // Load payout items
  const loadPayoutItems = useCallback(async () => {
    try {
      setPayoutItemsLoading(true);
      setPayoutItemsError(null);
      const data = await FinanceService.getPayoutItems(payoutBucket, payoutItemsPage, payoutItemsPageSize);
      if (data) {
        setPayoutItems(data.items || []);
        setPayoutItemsTotal(data.totalElements || 0);
        setPayoutItemsTotalPages(data.totalPages || 0);
      } else {
        setPayoutItems([]);
        setPayoutItemsTotal(0);
        setPayoutItemsTotalPages(0);
      }
    } catch (e: any) {
      setPayoutItemsError(e?.message || 'Không thể tải danh sách item payout');
      setPayoutItems([]);
      setPayoutItemsTotal(0);
      setPayoutItemsTotalPages(0);
    } finally {
      setPayoutItemsLoading(false);
    }
  }, [payoutBucket, payoutItemsPage, payoutItemsPageSize]);

  useEffect(() => {
    loadPayoutItems();
  }, [loadPayoutItems]);

  // Reset payout items page when bucket changes
  useEffect(() => {
    setPayoutItemsPage(0);
  }, [payoutBucket]);

  const handlePayoutBucketChange = useCallback((bucket: PayoutBucket) => {
    setPayoutBucket(bucket);
  }, []);

  const handlePayoutItemsPageChange = useCallback((newPage: number) => {
    setPayoutItemsPage(newPage);
  }, []);

  const handlePayoutItemsPageSizeChange = useCallback((newSize: number) => {
    setPayoutItemsPageSize(newSize);
    setPayoutItemsPage(0);
  }, []);

  const refresh = useCallback(() => {
    loadTransactions();
    loadWalletInfo();
    loadPayoutSummary();
    loadPayoutItems();
  }, [loadTransactions, loadWalletInfo, loadPayoutSummary, loadPayoutItems]);

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
    
    // Payout Summary
    payoutSummary,
    payoutSummaryLoading,
    payoutSummaryError,
    
    // Payout Items
    payoutItems,
    payoutItemsLoading,
    payoutItemsError,
    payoutBucket,
    handlePayoutBucketChange,
    payoutItemsPage,
    payoutItemsPageSize,
    payoutItemsTotal,
    payoutItemsTotalPages,
    handlePayoutItemsPageChange,
    handlePayoutItemsPageSizeChange,
    
    // Actions
    refresh,
    loadWalletInfo,
    loadPayoutSummary,
    loadPayoutItems,
  };
};

export default useFinance;

