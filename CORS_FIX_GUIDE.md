# Hướng dẫn fix lỗi CORS

## Vấn đề
Khi gọi API từ frontend (React) sang backend (Spring Boot), gặp lỗi CORS.

## Nguyên nhân
Backend Spring Boot chưa cấu hình CORS để cho phép frontend truy cập từ domain khác (localhost:5173).

## Giải pháp cho Backend (Spring Boot)

### 1. Tạo CORS Configuration Class

```java
package com.audiostore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow credentials
        config.setAllowCredentials(true);
        
        // Allow frontend origin (Vite default port)
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://localhost:3000");
        
        // Allow all headers
        config.addAllowedHeader("*");
        
        // Allow all HTTP methods
        config.addAllowedMethod("*");
        
        // Apply to all endpoints
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
```

### 2. Hoặc sử dụng @CrossOrigin annotation

Thêm vào Controller:

```java
@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class KycController {
    
    @PatchMapping("/{storeId}/kyc/{kycId}/approve")
    public ResponseEntity<?> approveKyc(@PathVariable String kycId) {
        // Your code here
    }
    
    @PatchMapping("/{storeId}/kyc/{kycId}/reject")
    public ResponseEntity<?> rejectKyc(
        @PathVariable String kycId,
        @RequestParam String reason
    ) {
        // Your code here
    }
}
```

## Lưu ý về {storeId}

Trong Swagger, bạn thấy endpoint:
```
PATCH /api/stores/{storeId}/kyc/{kycId}/approve
```

Nhưng vì đây là admin endpoint, backend nên:

### Option 1: Bỏ storeId khỏi path (Khuyến nghị)
```java
@PatchMapping("/kyc/{kycId}/approve")
public ResponseEntity<?> approveKyc(@PathVariable String kycId) {
    // Admin có thể approve bất kỳ KYC nào
}
```

### Option 2: Giữ storeId nhưng không validate
```java
@PatchMapping("/{storeId}/kyc/{kycId}/approve")
public ResponseEntity<?> approveKyc(
    @PathVariable String storeId,  // Có thể ignore giá trị này
    @PathVariable String kycId
) {
    // Chỉ cần dùng kycId để approve
}
```

## Test CORS

Sau khi cấu hình backend:

1. Restart backend server
2. Mở Developer Console (F12) trong browser
3. Gọi API từ frontend
4. Kiểm tra Network tab - không còn lỗi CORS

## Debug CORS

Nếu vẫn còn lỗi, kiểm tra:

1. **Response Headers** phải có:
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: *
   Access-Control-Allow-Credentials: true
   ```

2. **Preflight Request (OPTIONS)**:
   Browser sẽ gửi OPTIONS request trước khi gửi PATCH/POST/DELETE
   Backend phải trả về 200 OK cho OPTIONS request

3. **Authorization Header**:
   Nếu dùng Bearer token, đảm bảo backend accept header này
