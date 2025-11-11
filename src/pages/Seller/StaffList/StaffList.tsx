import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import { useStaffList } from '../../../hooks/useStaffList';
import LoadingSkeleton from '../../../components/common/LoadingSkeleton';
import { showCenterError } from '../../../utils/notification';

const StaffList: React.FC = () => {
  const navigate = useNavigate();
  const { staffList, isLoading, error, total, page, size, refresh, loadPage } = useStaffList(0, 10);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter staff list based on search term
  const filteredStaff = staffList.filter(staff => {
    const searchLower = searchTerm.toLowerCase();
    return (
      staff.fullName.toLowerCase().includes(searchLower) ||
      staff.username.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.phone.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateStaff = () => {
    navigate('/seller/dashboard/staff/create');
  };

  const handleEditStaff = (staffId: string) => {
    // Navigate to edit page (you can implement this later)
    navigate(`/seller/dashboard/staff/edit/${staffId}`);
  };

  const handleDeleteStaff = async (_staffId: string, staffName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${staffName}"?`)) {
      return;
    }
    try {
      // TODO: Implement delete functionality later
      // await StaffService.deleteStaff(staffId);
      showCenterError('Chức năng xóa nhân viên đang được phát triển', 'Thông báo');
    } catch (err: any) {
      showCenterError(err?.message || 'Không thể xóa nhân viên', 'Lỗi');
    }
  };

  const handlePageChange = (newPage: number) => {
    loadPage(newPage, size);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách nhân viên</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng: <span className="font-medium text-gray-900">{total}</span> nhân viên
          </p>
        </div>
        <button
          onClick={handleCreateStaff}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo nhân viên mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, username, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LoadingSkeleton type="list" />
        </div>
      )}

      {/* Staff List */}
      {!isLoading && !error && (
        <>
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {searchTerm ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateStaff}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Tạo nhân viên đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                              {staff.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{staff.fullName}</p>
                              <p className="text-xs text-gray-500">ID: {staff.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{staff.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{staff.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{staff.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditStaff(staff.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > size && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Hiển thị {page * size + 1} - {Math.min((page + 1) * size, total)} trong tổng số {total} nhân viên
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {page + 1} / {Math.ceil(total / size)}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={(page + 1) * size >= total}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffList;

