import React from 'react';
import AdminReturnDisputesList from '../../../components/AdminComponents/AdminReturnDisputesList';
import { useAdminReturnDisputes } from '../../../hooks/useAdminReturnDisputes';

const AdminReturnDisputesPage: React.FC = () => {
  const {
    disputes,
    isLoading,
    error,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
    refresh,
  } = useAdminReturnDisputes(0, 20);

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    if (newPageSize !== undefined && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(0); // Reset to first page when page size changes
    } else {
      // Convert from 1-based (pagination component) to 0-based (hook)
      setPage(newPage - 1);
    }
  };

  return (
    <div className="p-6">
      <AdminReturnDisputesList
        data={disputes}
        page={page + 1} // Convert 0-based to 1-based for display
        pageSize={pageSize}
        total={total}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onReload={refresh}
      />
    </div>
  );
};

export default AdminReturnDisputesPage;

