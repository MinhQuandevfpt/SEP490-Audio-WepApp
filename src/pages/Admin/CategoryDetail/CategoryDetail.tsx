import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CategoryService } from '../../../services/admin/CategoryService';
import type { CategoryItem } from '../../../types/api';
import { CategoriesEditModal } from '../../../components/AdminComponents/CategoryComponent';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<CategoryItem | null>(null);
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
        setItem(res.data as unknown as CategoryItem);
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
            onClick={async () => {
              if (!id) return;
              if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
              try {
                const res = await CategoryService.deleteCategory(id);
                showCenterSuccess(res?.message || 'Xóa danh mục thành công');
                navigate('/admin/categories');
              } catch (err: any) {
                showCenterError(err?.message || 'Xóa danh mục thất bại', 'Thất bại');
              }
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
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="animate-pulse h-10 bg-gray-200 rounded" />))}
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : item ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">ID</p>
              <p className="mt-1 text-gray-900 break-all">{item.categoryId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Tên</p>
              <p className="mt-1 text-gray-900">{item.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Slug</p>
              <p className="mt-1"><span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">{item.slug}</span></p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Sắp xếp</p>
              <p className="mt-1 text-gray-900">{item.sortOrder}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Mô tả</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{item.description || '-'}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-gray-600">Không tìm thấy danh mục</div>
        )}
      </div>
      <CategoriesEditModal
        open={openEdit}
        initial={item}
        onClose={() => setOpenEdit(false)}
        onUpdate={async (payload) => {
          if (!id) return;
          try {
            const up = await CategoryService.updateCategory(id, payload as any);
            showCenterSuccess(up?.message || 'Cập nhật danh mục thành công');
            const res = await CategoryService.getCategoryById(id);
            setItem(res.data as unknown as CategoryItem);
          } catch (err: any) {
            showCenterError(err?.message || 'Cập nhật danh mục thất bại', 'Thất bại');
            throw err;
          }
        }}
      />
    </div>
  );
};

export default CategoryDetail;


