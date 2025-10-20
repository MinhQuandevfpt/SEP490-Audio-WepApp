# 🎯 Smart Input Demo - SpecsSection

## ✨ Tính năng mới

### **Smart Input với Technical Suggestions**

Khi người dùng nhập thông số kỹ thuật, hệ thống sẽ hiển thị gợi ý với ký hiệu và định dạng chuẩn.

## 🔧 Cách hoạt động

### **1. Auto-suggestions khi focus**
- Khi click vào input field, danh sách gợi ý sẽ hiển thị
- Gợi ý được sắp xếp theo độ phổ biến và chuẩn kỹ thuật

### **2. Filter suggestions khi typing**
- Khi gõ, suggestions sẽ được lọc theo nội dung
- Hỗ trợ tìm kiếm theo cả value và label

### **3. Click để chọn**
- Click vào suggestion để tự động điền
- Input sẽ được focus và suggestions sẽ ẩn đi

## 📋 Danh sách fields có Smart Input

### **Thông số âm thanh chung:**
- **Dải tần (Hz)**: `20Hz-20kHz`, `20Hz-40kHz`, `30Hz-18kHz`, `50Hz-15kHz`
- **Độ nhạy (dB)**: `105dB/mW`, `98dB/mW`, `92dB/mW`, `110dB/V`
- **Trở kháng (Ω)**: `32Ω`, `16Ω`, `64Ω`, `300Ω`, `600Ω`
- **Công suất chịu đựng**: `100W RMS`, `200W Peak`, `50W RMS`, `300W RMS`
- **Điện áp**: `5V/2A`, `12V/1A`, `3.3V/1A`, `24V/2A`

### **Thông số vật lý:**
- **Trọng lượng**: `0.5kg`, `1.0kg`, `2.0kg`, `5.0kg`
- **Kích thước**: `20x15x10cm`, `30x20x15cm`, `40x25x20cm`

### **Thông số kỹ thuật nâng cao:**
- **Kích thước driver**: `6.5 inch`, `1 inch`, `3 inch`, `8 inch`
- **THD**: `<0.01%`, `<0.1%`, `<0.5%`, `<1%`
- **SNR**: `100dB`, `90dB`, `80dB`, `70dB`
- **Sample Rate**: `192kHz`, `96kHz`, `48kHz`, `44.1kHz`
- **Bit Depth**: `32-bit`, `24-bit`, `16-bit`
- **Max SPL**: `130dB`, `120dB`, `110dB`, `100dB`

## 🎨 UI/UX Features

### **Visual Design:**
- Dropdown suggestions với shadow và border
- Hover effects với background color change
- Typography hierarchy (value + description)
- Responsive design cho mobile/desktop

### **Interaction:**
- Smooth animations
- Keyboard navigation support
- Click outside to close
- Auto-focus management

### **Accessibility:**
- Proper ARIA labels
- Keyboard navigation
- Screen reader friendly
- High contrast support

## 🚀 Cách sử dụng

1. **Focus vào input field** → Suggestions hiển thị
2. **Gõ để filter** → Suggestions được lọc theo nội dung
3. **Click suggestion** → Value được điền tự động
4. **Click outside** → Suggestions ẩn đi

## 💡 Lợi ích

- **Tiết kiệm thời gian**: Không cần nhớ format chuẩn
- **Giảm lỗi**: Suggestions đảm bảo format đúng
- **UX tốt hơn**: Gợi ý trực quan và dễ sử dụng
- **Chuẩn hóa**: Tất cả thông số đều theo format chuẩn
- **Học hỏi**: User có thể học format chuẩn từ suggestions

## 🔧 Technical Implementation

- **React Hooks**: useState, useRef, useEffect
- **TypeScript**: Type safety cho suggestions
- **Tailwind CSS**: Responsive styling
- **Event Handling**: Focus, blur, click management
- **Performance**: Debounced filtering và efficient rendering
