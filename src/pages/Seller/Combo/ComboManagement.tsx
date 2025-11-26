import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  PoweroffOutlined,
  DeleteOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { ComboService } from '../../../services/seller/ComboService';
import { showSuccess, showError } from '../../../utils/notification';
import type { Combo } from '../../../types/seller';

const { confirm } = Modal;

const ComboManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set());

  const loadCombos = async () => {
    try {
      setLoading(true);
      const response = await ComboService.getCombos({
        page,
        size,
        keyword: searchKeyword || undefined,
        isActive: filterActive,
      });
      setCombos(response.data || []);
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, [page, filterActive]);

  const handleSearch = () => {
    setPage(0);
    loadCombos();
  };

  const handleToggleStatus = async (comboId: string, currentStatus: boolean) => {
    confirm({
      title: `Xác nhận ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} combo`,
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} combo này?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await ComboService.updateComboStatus(comboId, !currentStatus);
          showSuccess('Cập nhật trạng thái thành công!', 'Thành công');
          loadCombos();
        } catch (error: any) {
          showError(error?.message || 'Có lỗi xảy ra', 'Lỗi');
        }
      },
    });
  };

  const handleDelete = async (comboId: string) => {
    confirm({
      title: 'Xác nhận xóa combo',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc muốn xóa combo này? Hành động này không thể hoàn tác!',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await ComboService.deleteCombo(comboId);
          showSuccess('Xóa combo thành công!', 'Thành công');
          loadCombos();
        } catch (error: any) {
          showError(error?.message || 'Có lỗi xảy ra', 'Lỗi');
        }
      },
    });
  };

  const toggleComboExpand = (comboId: string) => {
    setExpandedCombos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(comboId)) {
        newSet.delete(comboId);
      } else {
        newSet.add(comboId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <InboxOutlined className="text-2xl text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Combo</h1>
                <p className="text-sm text-gray-500">Danh sách combo sản phẩm của cửa hàng</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/seller/dashboard/combos/create')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusOutlined />
              Tạo Combo Mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm combo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(undefined)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === undefined
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === true
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === false
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã vô hiệu hóa
            </button>
          </div>
        </div>

        {/* Combo List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : combos.length === 0 ? (
            <div className="text-center py-12">
              <InboxOutlined className="text-6xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Không tìm thấy combo nào</p>
              <button
                onClick={() => navigate('/seller/dashboard/combos/create')}
                className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
              >
                Tạo combo đầu tiên →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {combos.map((combo) => {
                const isExpanded = expandedCombos.has(combo.comboId);
                
                return (
                  <div
                    key={combo.comboId}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Expand button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => toggleComboExpand(combo.comboId)}
                            className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors group"
                            title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết'}
                          >
                            <span className="text-orange-600 font-bold text-xl leading-none">
                              {isExpanded ? '−' : '+'}
                            </span>
                          </button>
                        </div>

                        {/* Image */}
                        <img
                          src={combo.images[0] || '/placeholder.png'}
                          alt={combo.name}
                          className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{combo.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{combo.shortDescription}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  combo.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {combo.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                              </span>
                            </div>
                          </div>

                          {/* Combo item count */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">
                              Combo hiện có: <span className="text-orange-600 font-semibold">{combo.items.length}</span> mặt hàng
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Ngày tạo:</span>{' '}
                              {new Date(combo.createdAt).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/seller/dashboard/combos/${combo.comboId}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <EyeOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(combo.comboId, combo.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              combo.isActive
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={combo.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            <PoweroffOutlined className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(combo.comboId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <DeleteOutlined className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Items Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="space-y-3">
                          {(() => {
                            // Group items by productId
                            const groupedItems = combo.items.reduce((acc, item) => {
                              if (!acc[item.productId]) {
                                acc[item.productId] = [];
                              }
                              acc[item.productId].push(item);
                              return acc;
                            }, {} as Record<string, typeof combo.items>);

                            return Object.entries(groupedItems).map(([productId, items]) => (
                              <div key={productId} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                {/* Product Group Header */}
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-2 border-b border-orange-200">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">
                                      {items.length}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900 text-sm">{items[0].productName}</h5>
                                      <p className="text-xs text-gray-600">
                                        {items.length === 1 ? '1 mặt hàng' : `${items.length} mặt hàng (các phân loại)`}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Items List */}
                                <div className="divide-y divide-gray-100">
                                  {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                      {/* Item Number */}
                                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-semibold text-orange-700">{index + 1}</span>
                                      </div>

                                      {/* Product Image */}
                                      <img
                                        src={item.variantUrl || combo.images[0] || '/placeholder.png'}
                                        alt={item.productName}
                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                      />

                                      {/* Item Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {item.variantId ? (
                                            <p className="text-xs font-medium text-gray-900">
                                              <span className="text-orange-600">Phân loại:</span> {item.optionName} - {item.optionValue}
                                            </p>
                                          ) : (
                                            <p className="text-xs font-medium text-blue-600">Sản phẩm đơn</p>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs">
                                          {item.variantSku && (
                                            <>
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-500">SKU:</span>
                                                <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                                  {item.variantSku}
                                                </span>
                                              </div>
                                              <div className="h-3 w-px bg-gray-300"></div>
                                            </>
                                          )}
                                          {item.variantPrice !== undefined && item.variantPrice > 0 && (
                                            <>
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Giá:</span>
                                                <span className="font-semibold text-orange-600">
                                                  {item.variantPrice.toLocaleString('vi-VN')}đ
                                                </span>
                                              </div>
                                              <div className="h-3 w-px bg-gray-300"></div>
                                            </>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <span className="text-gray-500">SL:</span>
                                            <span className="font-semibold text-gray-900">×{item.quantity}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {combos.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page + 1}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={combos.length < size}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboManagement;
