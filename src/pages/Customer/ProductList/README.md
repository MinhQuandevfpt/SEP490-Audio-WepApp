# ProductListPage

Trang danh sách sản phẩm với đầy đủ tính năng tìm kiếm, lọc và phân trang.

## Tính năng

### 🔍 Tìm kiếm
- Tìm kiếm theo tên sản phẩm
- Tìm kiếm theo thương hiệu
- Tìm kiếm theo từ khóa

### 🎯 Bộ lọc
- **Danh mục**: Loa, Tai Nghe, Micro, DAC, Mixer, Amp, Turntable, Sound Card, DJ Controller, Combo
- **Trạng thái**: Đang bán, Bản nháp, Tạm dừng, Hết hàng, Ngừng sản xuất, Không hiển thị, Tạm khóa, Bị cấm
- **Khoảng giá**: Từ - Đến (VND)
- **Thương hiệu**: Nhập tên thương hiệu
- **Đánh giá**: 1-5 sao
- **Tình trạng kho**: Chỉ hiển thị sản phẩm còn hàng

### 📊 Sắp xếp
- Tên A-Z / Z-A
- Giá thấp đến cao / cao đến thấp
- Đánh giá cao nhất
- Mới nhất
- Xem nhiều nhất
- Bán chạy nhất

### 📱 Hiển thị
- **Chế độ lưới**: Hiển thị dạng card (mặc định)
- **Chế độ danh sách**: Hiển thị dạng list
- **Phân trang**: 12, 24, 48, 96 sản phẩm/trang

### 🔗 URL Parameters
- `category`: Danh mục sản phẩm
- `search`: Từ khóa tìm kiếm
- `status`: Trạng thái sản phẩm
- `page`: Số trang (1-based)
- `size`: Số sản phẩm/trang

## Cấu trúc file

```
src/pages/Customer/ProductList/
├── ProductListPage.tsx          # Trang chính
├── index.ts                     # Export
└── README.md                    # Hướng dẫn

src/components/ProductListComponents/
├── ProductListFilter.tsx        # Bộ lọc
├── ProductListSort.tsx          # Sắp xếp
├── ProductListPagination.tsx    # Phân trang
├── ProductListGrid.tsx          # Hiển thị sản phẩm
├── ProductListViewToggle.tsx    # Chuyển đổi chế độ xem
├── ProductListSkeleton.tsx      # Loading skeleton
└── index.ts                     # Export

src/services/customer/
└── ProductListService.ts        # API service

src/hooks/
└── useProductList.ts            # Custom hook

src/types/
└── productList.ts               # Type definitions

src/data/
└── productListData.ts           # Static data
```

## API Endpoint

```
GET http://localhost:8080/api/products
```

### Parameters
- `page`: Số trang (0-based)
- `size`: Số sản phẩm/trang
- `categoryName`: Tên danh mục
- `storeId`: ID cửa hàng
- `keyword`: Từ khóa tìm kiếm
- `status`: Trạng thái sản phẩm

### Response
```json
{
  "status": 200,
  "message": "📦 Product list filtered successfully",
  "data": {
    "content": [...],
    "pageable": {...},
    "totalPages": 1,
    "totalElements": 19,
    "last": true,
    "size": 20,
    "number": 0,
    "numberOfElements": 19,
    "first": true,
    "empty": false
  }
}
```

## Sử dụng

### Truy cập trang
```
/products
```

### Với bộ lọc
```
/products?category=Loa&search=bluetooth&page=1&size=24
```

### Với trạng thái
```
/products?status=active&category=Tai Nghe
```

## Dependencies

- React Router DOM (useSearchParams)
- Lucide React (icons)
- Tailwind CSS (styling)
- Custom hooks và services

## Notes

- Trang tự động sync với URL parameters
- Loading states được xử lý đầy đủ
- Error handling với toast notifications
- Responsive design cho mobile/desktop
- SEO-friendly URLs
