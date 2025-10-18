import { useState, useEffect, useCallback } from 'react';
import { AdminUserService } from '../services/admin/AdminUserService';
import type {
  CustomerListRequest,
  CustomerListResponse,
  CustomerStatsResponse,
  CustomerProfileResponse,
  UpdateCustomerStatusRequest,
  CustomerStatus
} from '../types/api';

// Hook state interfaces
interface UseUsersState {
  customers: CustomerProfileResponse[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

interface UseUsersActions {
  fetchCustomers: (params?: CustomerListRequest) => Promise<void>;
  updateCustomerStatus: (request: UpdateCustomerStatusRequest) => Promise<boolean>;
  refreshCustomers: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: CustomerStatus | undefined) => void;
  setSort: (sort: string) => void;
}

interface UseUsersReturn extends UseUsersState, UseUsersActions {
  // Additional computed values
  hasCustomers: boolean;
  isEmpty: boolean;
  canLoadMore: boolean;
}

// Main hook for managing customers
export const useUsers = (initialParams: CustomerListRequest = {}): UseUsersReturn => {
  const [state, setState] = useState<UseUsersState>({
    customers: [],
    loading: false,
    error: null,
    pagination: {
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    }
  });

  const [params, setParams] = useState<CustomerListRequest>({
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
    ...initialParams
  });

  // Fetch customers function
  const fetchCustomers = useCallback(async (fetchParams?: CustomerListRequest) => {
    const requestParams = { ...params, ...fetchParams };
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response: CustomerListResponse = await AdminUserService.getCustomers(requestParams);
      
      setState(prev => ({
        ...prev,
        customers: response.content,
        pagination: {
          page: response.number,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          first: response.first,
          last: response.last
        },
        loading: false
      }));

      // Update params if they were provided
      if (fetchParams) {
        setParams(prev => ({ ...prev, ...fetchParams }));
      }

    } catch (error: any) {
      const errorMessage = AdminUserService.formatApiError(error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      console.error('Failed to fetch customers:', error);
    }
  }, [params]);

  // Update customer status
  const updateCustomerStatus = useCallback(async (request: UpdateCustomerStatusRequest): Promise<boolean> => {
    try {
      await AdminUserService.updateCustomerStatus(request);
      
      // Update local state
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(customer => {
          if (customer.id !== request.customerId) return customer;

          const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
          const nextStatus = (allowedStatuses as readonly string[]).includes(request.status as string)
            ? (request.status as (typeof allowedStatuses)[number])
            : 'INACTIVE';

          return { ...customer, status: nextStatus };
        })
      }));

      return true;
    } catch (error: any) {
      const errorMessage = AdminUserService.formatApiError(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error('Failed to update customer status:', error);
      return false;
    }
  }, []);

  // Refresh customers
  const refreshCustomers = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  // Pagination actions
  const setPage = useCallback((page: number) => {
    fetchCustomers({ page });
  }, [fetchCustomers]);

  const setPageSize = useCallback((size: number) => {
    fetchCustomers({ page: 0, size });
  }, [fetchCustomers]);

  // Filter actions
  const setSearchKeyword = useCallback((keyword: string) => {
    fetchCustomers({ page: 0, keyword: keyword || undefined });
  }, [fetchCustomers]);

  const setStatusFilter = useCallback((status: CustomerStatus | undefined) => {
    fetchCustomers({ page: 0, status });
  }, [fetchCustomers]);

  const setSort = useCallback((sort: string) => {
    fetchCustomers({ page: 0, sort });
  }, [fetchCustomers]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, []); // Only run on mount

  // Computed values
  const hasCustomers = state.customers.length > 0;
  const isEmpty = !state.loading && state.customers.length === 0;
  const canLoadMore = !state.pagination.last && !state.loading;

  return {
    // State
    customers: state.customers,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    
    // Actions
    fetchCustomers,
    updateCustomerStatus,
    refreshCustomers,
    setPage,
    setPageSize,
    setSearchKeyword,
    setStatusFilter,
    setSort,
    
    // Computed
    hasCustomers,
    isEmpty,
    canLoadMore
  };
};

// Hook for customer statistics
export const useCustomerStats = () => {
  const [stats, setStats] = useState<CustomerStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminUserService.getCustomerStats();
      setStats(response);
    } catch (error: any) {
      const errorMessage = AdminUserService.formatApiError(error);
      setError(errorMessage);
      console.error('Failed to fetch customer stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  };
};

// Hook for individual customer actions
export const useCustomerActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (customerId: string, status: CustomerStatus): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminUserService.updateCustomerStatus({ customerId, status });
      setLoading(false);
      return !!response.success;
    } catch (error: any) {
      const errorMessage = AdminUserService.formatApiError(error);
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, []);

  const getCustomer = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const customer = await AdminUserService.getCustomerById(customerId);
      setLoading(false);
      return customer;
    } catch (error: any) {
      const errorMessage = AdminUserService.formatApiError(error);
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    updateStatus,
    getCustomer
  };
};

export default useUsers;
