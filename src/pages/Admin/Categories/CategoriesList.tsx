import React, { useEffect, useMemo, useState } from 'react';
import { CategoryService } from '../../../services/admin/CategoryService';
import type { CategoryItem } from '../../../types/api';
import { CategoriesHeader, CategoriesSearchBar, CategoriesTable, CategoriesPagination, CategoriesCreateModal } from '../../../components/AdminComponents/CategoryComponent';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

const CategoriesList: React.FC = () => {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [openCreate, setOpenCreate] = useState(false);

  const fetchData = async (kw?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await CategoryService.getCategories(kw);
      setItems(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh mục');
      showCenterError(e?.message || 'Không thể tải danh mục', 'Thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => items, [items]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <CategoriesHeader />

      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex justify-end px-6 pt-6">
          <button onClick={() => setOpenCreate(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Thêm mục lục</button>
        </div>
        <CategoriesSearchBar
          keyword={keyword}
          onChange={setKeyword}
          onSearch={() => fetchData(keyword)}
          onClear={() => { setKeyword(''); fetchData(''); }}
        />

        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-200 rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-600">Không có danh mục</div>
          ) : (
            <div>
              <CategoriesTable items={pagedItems} />
              <CategoriesPagination
                total={filtered.length}
                page={currentPage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
              />
            </div>
          )}
        </div>
      </div>

      <CategoriesCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={async (payload) => {
          try {
            const res = await CategoryService.createCategory(payload as any);
            showCenterSuccess(res?.message || 'Tạo danh mục thành công');
            await fetchData('');
          } catch (err: any) {
            showCenterError(err?.message || 'Tạo danh mục thất bại', 'Thất bại');
            throw err;
          }
        }}
      />
    </div>
  );
};

export default CategoriesList;


