# 🎵 AudioShop - Audio E-commerce Platform

Hệ thống bán âm thanh trực tuyến được thiết kế theo phong cách Shopee với giao diện hiện đại và thân thiện với người dùng.

## 🚀 Tính năng

### 🔐 Authentication System
- **Đăng nhập** với email hoặc số điện thoại
- **Đăng ký** tài khoản mới với đầy đủ thông tin
- **Social Login** với Google và Facebook
- **AuthLayout** responsive với thiết kế đẹp mắt

### 🏠 Homepage
- **Banner Slider** quảng cáo sản phẩm
- **Flash Sale** với đồng hồ đếm ngược
- **Top Deals** sản phẩm hot
- **Featured Brands** thương hiệu nổi bật
- **Product Suggestions** gợi ý sản phẩm

## 📁 Cấu trúc dự án

```
src/
├── components/          # Các components tái sử dụng
│   ├── AuthLayout/     # Layout cho trang đăng nhập/đăng ký
│   ├── Layout/         # Layout chính của ứng dụng
│   ├── Header/         # Header với search và navigation
│   ├── Footer/         # Footer của website
│   ├── Sidebar/        # Sidebar danh mục sản phẩm
│   ├── BannerSlider/   # Slider banner chính
│   ├── FlashSale/      # Component flash sale
│   ├── TopDeals/       # Component top deals
│   ├── FeaturedBrands/ # Component thương hiệu nổi bật
│   ├── ProductSuggestions/ # Component gợi ý sản phẩm
│   ├── ProductCard/    # Card hiển thị sản phẩm
│   └── common/         # Components dùng chung
│       ├── InputField.tsx      # Input field có validation
│       ├── SocialLoginButton.tsx # Button đăng nhập mạng xã hội
│       └── index.ts
├── pages/              # Các trang chính
│   ├── HomePage/       # Trang chủ
│   └── Customer/       # Các trang liên quan đến khách hàng
│       ├── Login/      # Trang đăng nhập
│       └── Register/   # Trang đăng ký
├── routes/             # Cấu hình routing
│   └── index.tsx       # Main router config
├── data/               # Dữ liệu mẫu
│   ├── banners.ts      # Dữ liệu banner
│   ├── brands.ts       # Dữ liệu thương hiệu
│   ├── categories.ts   # Dữ liệu danh mục
│   └── products.ts     # Dữ liệu sản phẩm
├── services/           # API services (sẽ phát triển)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main App component
└── main.tsx            # Entry point
```

## 🎨 Design System

### 🎨 Màu sắc chính
- **Orange**: `#f97316` (orange-500) - Màu chủ đạo
- **Blue**: `#2563eb` (blue-600) - Màu phụ
- **Gray**: Các tone xám cho text và border

### 📱 Responsive Design
- **Mobile First**: Thiết kế ưu tiên mobile
- **Breakpoints**: sm, md, lg, xl theo Tailwind CSS
- **Grid System**: Flexbox và CSS Grid

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🚀 Getting Started

1. **Clone repository**
```bash
git clone <repository-url>
cd SEP490-Audio-WepApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
Navigate to `http://localhost:5173`

## 📱 Navigation

### 🔗 Routes
- `/` - Trang chủ
- `/auth/login` - Đăng nhập
- `/auth/register` - Đăng ký

### 🧭 Navigation từ Header
- Click "Đăng nhập" hoặc "Đăng ký" ở góc phải header
- Logo "AudioShop" dẫn về trang chủ
- "Trang chủ" button trong header

## 🎯 Features Overview

### 🔐 Authentication Pages

#### Login Page (`/auth/login`)
- Toggle giữa email và số điện thoại
- Show/hide password
- Remember me checkbox
- Social login (Google, Facebook)
- Link đến trang đăng ký

#### Register Page (`/auth/register`)
- Form đầy đủ thông tin cá nhân
- Validation mật khẩu
- Checkbox đồng ý điều khoản
- Social register
- Link đến trang đăng nhập

### 🏠 HomePage
- **Layout responsive** với sidebar và main content
- **Banner slider** với hình ảnh sản phẩm
- **Flash sale section** 
- **Top deals** sản phẩm nổi bật
- **Featured brands** thương hiệu
- **Product suggestions** dựa trên xu hướng

## 🔧 Development Notes

### 📁 File Organization
- Mỗi component có folder riêng với `index.ts` để export
- Các common components trong `components/common/`
- Pages được nhóm theo chức năng (Customer, Admin...)
- Routing tập trung trong `routes/`

### 🎨 Styling Guidelines
- Sử dụng Tailwind CSS classes
- Consistent spacing và colors
- Responsive design cho tất cả components
- Hover effects và transitions

### 🔄 State Management
- React hooks cho local state
- Sẽ tích hợp Context API hoặc Redux khi cần

## 🚧 Todo / Future Enhancements

- [ ] Tích hợp API backend
- [ ] Add product search functionality
- [ ] Implement shopping cart
- [ ] Add user profile management
- [ ] Payment integration
- [ ] Order tracking
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Admin dashboard

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trong repository hoặc liên hệ team development.