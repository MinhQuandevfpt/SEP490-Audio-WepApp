import React from 'react';
import { Link } from 'react-router-dom';
import type { CategoryItem } from '../../../types/api';

interface CategoriesTableProps {
  items: CategoryItem[];
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">Không có danh mục</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Icon</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mô tả</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sắp xếp</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {items.map((c, idx) => (
            <tr key={c.categoryId} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs font-mono text-gray-500" title={c.categoryId}>
                  {c.categoryId.slice(0, 8)}...
                </span>
              </td>
              <td className="px-4 py-3">
                {c.iconUrl ? (
                  <img 
                    src={c.iconUrl} 
                    alt={c.name}
                    className="w-8 h-8 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">-</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-medium text-gray-900">{c.name}</span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                  {c.slug}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700 max-w-xs">
                <div className="truncate" title={c.description || undefined}>
                  {c.description || <span className="text-gray-400">-</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                  {c.sortOrder}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/admin/categories/${c.categoryId}`}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-md text-xs font-medium shadow-sm transition-colors"
                >
                  Chi tiết
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoriesTable;


