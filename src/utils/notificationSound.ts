/**
 * Utility để phát âm thanh thông báo
 */

/**
 * Phát âm thanh thông báo từ file MP3
 * Sử dụng file tingting.mp3 trong thư mục public
 */
export const playNotificationSound = (): void => {
  try {
    // Sử dụng file MP3 từ public folder
    // File trong public folder có thể truy cập trực tiếp từ root path
    const audio = new Audio('/tingting.mp3');
    audio.volume = 0.5; // Volume 50% để không quá to
    
    // Phát âm thanh
    audio.play().catch((error) => {
      console.warn('Không thể phát âm thanh thông báo:', error);
      // Có thể do browser policy yêu cầu user interaction trước
      // Hoặc file không tồn tại
    });
  } catch (error) {
    console.warn('Lỗi khi tạo Audio object:', error);
  }
};

/**
 * Kiểm tra xem đã phát âm thanh thông báo sau login chưa
 */
export const hasPlayedNotificationSound = (): boolean => {
  return sessionStorage.getItem('sellerNotificationSoundPlayed') === 'true';
};

/**
 * Đánh dấu đã phát âm thanh thông báo
 */
export const markNotificationSoundPlayed = (): void => {
  sessionStorage.setItem('sellerNotificationSoundPlayed', 'true');
};

/**
 * Reset flag (dùng khi logout)
 */
export const resetNotificationSoundFlag = (): void => {
  sessionStorage.removeItem('sellerNotificationSoundPlayed');
};

