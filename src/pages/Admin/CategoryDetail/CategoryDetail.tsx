import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CategoryService } from '../../../services/admin/CategoryService';
import type { CategoryDetailData } from '../../../types/api';
import { CategoriesEditModal } from '../../../components/AdminComponents/CategoryComponent';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import { Tag, Spin, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<CategoryDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await CategoryService.getCategoryById(id);
        setItem(res.data);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải chi tiết danh mục');
        showCenterError(e?.message || 'Không thể tải chi tiết danh mục', 'Thất bại');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Chi tiết danh mục</h2>
          <p className="mt-1 text-sm text-gray-500">Xem thông tin danh mục và thao tác</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <button onClick={() => setOpenEdit(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Chỉnh sửa</button>
          <button
            onClick={() => {
              if (!id) return;
              Modal.confirm({
                title: 'Xác nhận xóa danh mục',
                icon: <ExclamationCircleOutlined />,
                content: `Bạn có chắc chắn muốn xóa danh mục "${item?.name || ''}"? Hành động này không thể hoàn tác.`,
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: async () => {
                  try {
                    const res = await CategoryService.deleteCategory(id);
                    showCenterSuccess(res?.message || 'Xóa danh mục thành công');
                    navigate('/admin/categories');
                  } catch (err: any) {
                    showCenterError(err?.message || 'Xóa danh mục thất bại', 'Thất bại');
                  }
                }
              });
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Xóa
          </button>
          <Link to="/admin/categories" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Quay lại</Link>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center items-center min-h-[200px]">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : item ? (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">ID</p>
                  <p className="text-sm text-gray-900 break-all font-mono">{item.categoryId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tên danh mục</p>
                  <p className="text-sm text-gray-900 font-medium">{item.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Danh mục cha</p>
                  <p className="text-sm text-gray-900">
                    {item.parentId ? (
                      <span className="font-mono">{item.parentId}</span>
                    ) : (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Attributes Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thuộc tính ({item.attributes.length})
              </h3>
              {item.attributes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tên thuộc tính
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Nhãn hiển thị
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Kiểu dữ liệu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tùy chọn
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {item.attributes.map((attr, idx) => (
                        <tr key={attr.attributeId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-500" title={attr.attributeId}>
                              {attr.attributeId.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{attr.attributeName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{attr.attributeLabel}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Tag color={
                              attr.dataType === 'STRING' ? 'blue' :
                              attr.dataType === 'NUMBER' ? 'green' :
                              attr.dataType === 'BOOLEAN' ? 'orange' :
                              attr.dataType === 'DATE' ? 'purple' :
                              attr.dataType === 'SELECT' ? 'cyan' :
                              'default'
                            }>
                              {attr.dataType}
                            </Tag>
                          </td>
                          <td className="px-4 py-3">
                            {attr.options && attr.options.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {attr.options.map((option, idx) => (
                                  <Tag key={idx} color="geekblue" className="text-xs">
                                    {option}
                                  </Tag>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Không có</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Không có thuộc tính nào</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-gray-600">Không tìm thấy danh mục</div>
        )}
      </div>
      {item && (
        <CategoriesEditModal
          open={openEdit}
          initial={item}
          onClose={() => setOpenEdit(false)}
          onUpdate={async (payload) => {
            if (!id) return;
            try {
              const up = await CategoryService.updateCategory(id, payload);
              showCenterSuccess(up?.message || 'Cập nhật danh mục thành công');
              const res = await CategoryService.getCategoryById(id);
              setItem(res.data);
            } catch (err: any) {
              showCenterError(err?.message || 'Cập nhật danh mục thất bại', 'Thất bại');
              throw err;
            }
          }}
        />
      )}
    </div>
  );
};

export default CategoryDetail;


