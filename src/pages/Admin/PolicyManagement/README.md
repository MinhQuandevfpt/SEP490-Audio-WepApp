# Policy Management System - Admin

Hệ thống quản lý chính sách cho admin với đầy đủ chức năng CRUD cho categories và items.

## 📁 Cấu trúc Files

```
src/
├── services/admin/
│   └── PolicyService.ts              # Service xử lý API calls
├── types/
│   └── policy.ts                     # TypeScript interfaces
├── hooks/
│   ├── usePolicyCategories.ts        # Hook quản lý categories
│   └── usePolicyItems.ts             # Hook quản lý items
├── components/AdminComponents/PolicyComponents/
│   ├── PolicyCategoriesTable.tsx     # Bảng hiển thị danh sách categories
│   ├── PolicyCategoryForm.tsx        # Form tạo/sửa category
│   ├── PolicyItemsTable.tsx          # Bảng hiển thị danh sách items
│   ├── PolicyItemForm.tsx            # Form tạo/sửa item
│   └── index.ts                      # Export components
└── pages/Admin/PolicyManagement/
    ├── PolicyManagement.tsx          # Main page
    └── index.ts                      # Export page
```

## 🚀 Tính năng

### Categories Management
- ✅ Xem danh sách tất cả categories
- ✅ Tạo category mới với icon, mô tả, thứ tự hiển thị
- ✅ Chỉnh sửa thông tin category
- ✅ Xóa category (có confirm)
- ✅ Toggle trạng thái active/inactive
- ✅ Xem số lượng items trong mỗi category
- ✅ Preview icon URL

### Items Management
- ✅ Xem danh sách items theo category
- ✅ Tạo item mới với nội dung, hình ảnh, thứ tự
- ✅ Chỉnh sửa thông tin item
- ✅ Xóa item (có confirm)
- ✅ Toggle trạng thái active/inactive
- ✅ Quản lý nhiều hình ảnh cho mỗi item
- ✅ Rich text content support
- ✅ Navigation giữa categories và items

### UI/UX Features
- 🎨 Modern, responsive design với Tailwind CSS
- 📊 Dashboard với statistics cards
- 🔄 Loading states và error handling
- ✨ Smooth transitions và hover effects
- 📱 Mobile-friendly layout
- 🎭 Modal forms cho create/edit
- ⚡ Real-time updates sau mỗi action

## 🔌 API Endpoints

### Categories
- `GET /api/policies/categories` - Lấy tất cả categories
- `POST /api/policies/categories` - Tạo category mới
- `PUT /api/policies/categories/:id` - Cập nhật category
- `DELETE /api/policies/categories/:id` - Xóa category

### Items
- `GET /api/policies/categories/:categoryId/items` - Lấy items của category
- `POST /api/policies/items` - Tạo item mới
- `PUT /api/policies/items/:id` - Cập nhật item
- `DELETE /api/policies/items/:id` - Xóa item

## 🛠️ Cách sử dụng

### 1. Truy cập trang quản lý
```
URL: /admin/policies
```

### 2. Quản lý Categories
- Click "Tạo danh mục" để tạo category mới
- Điền thông tin: tên, mô tả, icon URL, thứ tự hiển thị
- Click icon "Mắt" để xem items trong category
- Click icon "Bút" để chỉnh sửa category
- Click icon "Thùng rác" để xóa category

### 3. Quản lý Items
- Từ màn hình categories, click vào một category để xem items
- Click "Tạo mục mới" để thêm item
- Điền thông tin: tiêu đề, nội dung, hình ảnh, thứ tự
- Có thể thêm nhiều hình ảnh cho mỗi item
- Click "Quay lại" để về danh sách categories

## 💡 Best Practices

### Performance
- ✅ Sử dụng React hooks tối ưu với useCallback
- ✅ Lazy loading cho images
- ✅ Debounce cho search/filter (có thể thêm sau)
- ✅ Memoization cho computed values

### Code Quality
- ✅ TypeScript strict mode
- ✅ Component composition pattern
- ✅ Separation of concerns (Service/Hook/Component)
- ✅ Error boundaries (có thể thêm)
- ✅ Consistent naming conventions

### Security
- ✅ Admin-only route protection
- ✅ Input validation
- ✅ XSS protection với proper escaping
- ✅ CORS handling trong HttpInterceptor

## 🎯 Roadmap

### Phase 2 Features (Có thể thêm)
- [ ] Drag & drop để sắp xếp thứ tự
- [ ] Bulk actions (xóa nhiều, toggle nhiều)
- [ ] Search và filter
- [ ] Pagination cho danh sách lớn
- [ ] Export/Import JSON
- [ ] Rich text editor (TinyMCE) cho content
- [ ] Image upload thay vì URL
- [ ] Version history
- [ ] Audit logs
- [ ] Notification toast thay alert()

## 📝 Notes

- API sử dụng HttpInterceptor với auto token refresh
- Tất cả API calls đều có error handling
- Form validation được thực hiện ở cả client và server
- Icons và images có fallback khi load lỗi
- Responsive design hoạt động tốt trên mobile, tablet, desktop

## 🐛 Troubleshooting

### Lỗi không load được categories
- Kiểm tra token authentication
- Verify API endpoint đúng
- Check console để xem error message

### Image không hiển thị
- Verify image URL hợp lệ và accessible
- Check CORS settings nếu image từ external domain

### Form submit bị lỗi
- Kiểm tra validation messages
- Verify tất cả required fields đã điền
- Check network tab để xem API response

## 🤝 Contributing

Khi thêm features mới:
1. Thêm types vào `policy.ts`
2. Thêm API methods vào `PolicyService.ts`
3. Update hooks nếu cần
4. Tạo/update components
5. Test trên nhiều screen sizes
6. Update documentation này

---

Developed with ❤️ for SEP490 Audio WebApp
