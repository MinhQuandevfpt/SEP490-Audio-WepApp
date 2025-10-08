# 🏪 AudioShop Seller Center - Hệ thống bán hàng

Kênh người bán chuyên nghiệp cho AudioShop, thiết kế theo phong cách Shopee Seller Center với giao diện hiện đại và đầy đủ tính năng.

## 🎯 Tính năng Seller Center

### 🔐 Authentication System
- **Seller Login** (`/seller/login`) - Đăng nhập dành cho người bán
- **Seller Register** (`/seller/register`) - Đăng ký tài khoản bán hàng với 3 bước
- **SellerLayout** - Layout chuyên biệt cho seller với branding riêng

### 📋 Quy trình đăng ký Seller (3 bước)

#### Bước 1: Thông tin cá nhân
- Họ và tên
- Email kinh doanh
- Số điện thoại
- Mật khẩu (bảo mật cao)

#### Bước 2: Thông tin kinh doanh
- Tên cửa hàng
- Loại hình kinh doanh (Cá nhân/Công ty/Hộ kinh doanh)
- Số giấy phép kinh doanh (optional)
- Mã số thuế (optional)
- Địa chỉ kinh doanh

#### Bước 3: Thông tin thanh toán
- Tên ngân hàng
- Số tài khoản
- Tên chủ tài khoản
- Đồng ý điều khoản

## 🎨 Design System cho Seller

### 🎨 Màu sắc Seller
- **Primary**: Blue gradient (`from-blue-500 to-indigo-600`)
- **Secondary**: Indigo shades
- **Background**: Blue/Indigo gradients (`from-blue-50 to-indigo-100`)

### 🖼️ Visual Design
- **Layout**: Split screen (50-50) với benefits bên trái
- **Icons**: Lucide React với business-focused icons
- **Animations**: Smooth transitions và hover effects
- **Typography**: Professional và clear hierarchy

## 📁 Cấu trúc Seller

```
src/
├── components/
│   └── SellerLayout/           # Layout riêng cho seller
│       ├── SellerLayout.tsx    # Main layout component
│       └── index.ts
├── pages/
│   └── Seller/                 # Tất cả pages của seller
│       ├── Login/              # Đăng nhập seller
│       │   ├── SellerLogin.tsx
│       │   └── index.ts
│       ├── Register/           # Đăng ký seller (3 steps)
│       │   ├── SellerRegister.tsx
│       │   └── index.ts
│       └── Dashboard/          # Dashboard (sẽ phát triển)
└── routes/
    └── index.tsx               # Routing cho seller
```

## 🔗 Routes & Navigation

### 🛣️ Seller Routes
- `/seller/login` - Trang đăng nhập seller
- `/seller/register` - Trang đăng ký seller
- `/seller/dashboard` - Dashboard (preparation)

### 🧭 Navigation Flow
1. **Header** → "Bán hàng cùng AudioShop" → `/seller/login`
2. **SellerLogin** → "Đăng ký làm Seller" → `/seller/register`
3. **SellerRegister** → "Đã có tài khoản" → `/seller/login`

## 🏪 SellerLayout Features

### 📊 Left Side Benefits
- **Doanh thu minh bạch** - Real-time analytics
- **Tiếp cận hàng triệu khách hàng** - Market reach
- **Công cụ marketing mạnh mẽ** - Sales tools
- **Dễ dàng quản lý cửa hàng** - Management dashboard

### 📈 Statistics Display
- **10K+ Nhà bán hàng**
- **1M+ Sản phẩm**
- **5M+ Khách hàng**

### 🔗 Support Links
- Trung tâm hỗ trợ
- Hướng dẫn bán hàng  
- Chính sách phí
- Điều khoản

## 🔐 Security Features

### 🛡️ Business-Grade Security
- **Security Badge** hiển thị "Bảo mật cao cấp"
- **Strong Password** requirement (min 8 chars)
- **Business Email** validation
- **Legal Compliance** với điều khoản

### ✅ Validation & UX
- **Real-time validation** cho form fields
- **Step-by-step wizard** để dễ dàng hoàn thành
- **Progress indicator** với checkmarks
- **Responsive design** cho mọi thiết bị

## 🎯 Seller Login Features

### 🔑 Authentication
- Email-based login (business email)
- Secure password với show/hide
- Remember me option
- Forgot password link

### 💼 Business Focus
- Professional branding
- Business-oriented messaging
- Security emphasis
- Quick registration CTA

### ✨ UI/UX Highlights
- Clean, professional design
- Security badges và trust indicators
- Feature highlights cho sellers
- Support links prominent

## 🚀 Getting Started (Seller)

### 👤 Để test Seller features:
1. **Navigate to**: `http://localhost:5174/seller/login`
2. **Hoặc**: Click "Bán hàng cùng AudioShop" trong header
3. **Register**: Click "Đăng ký làm Seller" → 3-step wizard
4. **Login**: Sử dụng credentials đã đăng ký

### 🔄 User Flow
```
Header "Bán hàng cùng AudioShop" 
    ↓
SellerLogin (/seller/login)
    ↓ (Chưa có tài khoản)
SellerRegister (/seller/register)
    ↓ (3 steps)
Success → SellerDashboard (future)
```

## 🎨 Component Architecture

### 🧩 SellerLayout
- **Responsive** split-screen design
- **Benefits showcase** bên trái
- **Form area** bên phải
- **Professional footer** với support links

### 📝 SellerLogin
- **Business-focused** form
- **Security emphasis**
- **Feature highlights**
- **Quick registration** path

### 📋 SellerRegister
- **3-step wizard** approach
- **Progress indicator**
- **Comprehensive** business info collection
- **Bank details** for payments
- **Legal agreements** compliance

## 🔮 Future Enhancements

- [ ] Seller Dashboard với analytics
- [ ] Product management system
- [ ] Order management
- [ ] Revenue tracking
- [ ] Marketing tools (vouchers, ads)
- [ ] Customer management
- [ ] Inventory management
- [ ] Seller verification process
- [ ] Multi-language support
- [ ] Mobile app integration

## 📞 Seller Support

### 🆘 Hỗ trợ Seller
- **24/7 Support** cho business accounts
- **Dedicated help center** cho sellers
- **Business consultation** services
- **Training programs** cho new sellers

Seller Center này được thiết kế để cung cấp trải nghiệm chuyên nghiệp cho các nhà bán hàng, tương tự như Shopee Seller Center nhưng tập trung vào lĩnh vực âm thanh! 🎵