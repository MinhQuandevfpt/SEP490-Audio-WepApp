import React, { useState, useEffect } from 'react';
import { X, User, FileText, Check } from 'lucide-react';
import { StaffService } from '../../services/seller/StaffService';
import { StoreOrderService } from '../../services/seller/OrderService';
import { showCenterSuccess, showCenterError } from '../../utils/notification';
import type { StaffInfo } from '../../types/seller';

interface Props {
  orderId: string;
  onClose: () => void;
  onSuccess?: () => void; // Callback khi assign thành công
}

const AssignDeliveryModal: React.FC<Props> = ({ orderId, onClose, onSuccess }) => {
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [staffId, setStaffId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Load staff list
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setIsLoadingStaff(true);
        const response = await StaffService.getStaffList(0, 100); // Get all staff
        if (response.data?.content) {
          setStaffList(response.data.content);
        }
      } catch (error: any) {
        console.error('Error loading staff:', error);
        showCenterError(error?.message || 'Không thể tải danh sách nhân viên', 'Lỗi');
      } finally {
        setIsLoadingStaff(false);
      }
    };

    loadStaff();
  }, []);

  const handleSubmit = async () => {
    // Validate
    if (!staffId) {
      showCenterError('Vui lòng chọn nhân viên tiếp nhận', 'Lỗi');
      return;
    }

    try {
      setIsSubmitting(true);
      // Set cả deliveryStaffId và preparedByStaffId cùng giá trị (ẩn phía sau)
      await StoreOrderService.assignDeliveryStaff(orderId, {
        deliveryStaffId: staffId,
        preparedByStaffId: staffId, // Tự động set cùng ID
        note: note || null,
      });

      showCenterSuccess('Phân công nhân viên tiếp nhận thành công', 'Thành công');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể phân công nhân viên tiếp nhận', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Phân công nhân viên</h2>
            <p className="text-sm text-gray-500 mt-1">Mã đơn: {orderId.slice(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Staff Selection (Required) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Chọn nhân viên tiếp nhận *</span>
            </label>
            {isLoadingStaff ? (
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : (
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">-- Chọn nhân viên tiếp nhận --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} ({staff.username}) - {staff.phone}
                  </option>
                ))}
              </select>
            )}
            {staffList.length === 0 && !isLoadingStaff && (
              <p className="text-xs text-gray-500 mt-1">Chưa có nhân viên nào trong cửa hàng</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Ghi chú giao hàng</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Giao giờ hành chính, Giao trước 12h, ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">Ghi chú về việc giao hàng (nếu có)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !staffId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Xác nhận</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryModal;

