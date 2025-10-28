export interface ProductListFilters {
  categoryName?: string;
  storeId?: string;
  keyword?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'UNLISTED' | 'SUSPENDED' | 'BANNED';
  minPrice?: number;
  maxPrice?: number;
  brandName?: string;
  rating?: number;
  inStock?: boolean;
}

export interface ProductListPagination {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProductListSort {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'viewCount' | 'soldCount';
  direction: 'asc' | 'desc';
}

export interface ProductListState {
  products: any[];
  loading: boolean;
  error: string | null;
  filters: ProductListFilters;
  pagination: ProductListPagination;
  sort: ProductListSort;
}

export interface ProductListActions {
  setFilters: (filters: Partial<ProductListFilters>) => void;
  setPagination: (pagination: Partial<ProductListPagination>) => void;
  setSort: (sort: ProductListSort) => void;
  fetchProducts: () => Promise<void>;
  resetFilters: () => void;
  clearError: () => void;
}

export const PRODUCT_CATEGORIES = [
  'Loa',
  'Tai Nghe', 
  'Micro',
  'DAC',
  'Mixer',
  'Amp',
  'Turntable',
  'Sound Card',
  'DJ Controller',
  'Combo'
] as const;

export const PRODUCT_STATUSES = [
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'INACTIVE', label: 'Tạm dừng' },
  { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
  { value: 'DISCONTINUED', label: 'Ngừng sản xuất' },
  { value: 'UNLISTED', label: 'Không hiển thị' },
  { value: 'SUSPENDED', label: 'Tạm khóa' },
  { value: 'BANNED', label: 'Bị cấm' }
] as const;

export const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Tên A-Z' },
  { value: 'name:desc', label: 'Tên Z-A' },
  { value: 'price:asc', label: 'Giá thấp đến cao' },
  { value: 'price:desc', label: 'Giá cao đến thấp' },
  { value: 'rating:desc', label: 'Đánh giá cao nhất' },
  { value: 'createdAt:desc', label: 'Mới nhất' },
  { value: 'viewCount:desc', label: 'Xem nhiều nhất' },
  { value: 'soldCount:desc', label: 'Bán chạy nhất' }
] as const;

export const PAGE_SIZES = [12, 24, 48, 96] as const;

export const PAGE_SIZE_OPTIONS = [
  { value: 12, label: '12 sản phẩm/trang' },
  { value: 24, label: '24 sản phẩm/trang' },
  { value: 48, label: '48 sản phẩm/trang' },
  { value: 96, label: '96 sản phẩm/trang' }
] as const;