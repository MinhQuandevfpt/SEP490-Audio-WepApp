import React from 'react';
import { StaffOrderTable } from '../../../components/StaffOrderComponents';

const OrderPageStaff: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-1">Danh sách đơn hàng của cửa hàng bạn.</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <StaffOrderTable />
      </div>
    </div>
  );
};

export default OrderPageStaff;


