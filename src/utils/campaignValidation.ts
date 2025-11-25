import type { FlashSlot } from '../types/admin';

export interface CampaignValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate campaign time constraints
 */
export const validateCampaignTimes = (
  startTime: string,
  endTime: string,
  isEdit: boolean = false,
  originalStartTime?: string,
  campaignStatus?: string
): CampaignValidationResult => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // 1. Validate startTime < endTime
  if (start >= end) {
    return {
      isValid: false,
      error: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc'
    };
  }

  // 2. Don't allow creating campaign that starts in the past (for create mode)
  if (!isEdit && start < now) {
    return {
      isValid: false,
      error: 'Không thể tạo chiến dịch bắt đầu trong quá khứ'
    };
  }

  // 3. For edit mode: Don't allow modifying time if campaign has started
  if (isEdit && originalStartTime && campaignStatus) {
    const originalStart = new Date(originalStartTime);
    const hasStarted = now >= originalStart;
    
    // If campaign has started (ACTIVE, EXPIRED, CLOSED), lock all time modifications
    // Status: DRAFT, ONOPEN, ACTIVE, EXPIRED, DISABLED
    if (hasStarted && (campaignStatus === 'ACTIVE' || campaignStatus === 'EXPIRED' || campaignStatus === 'DISABLED')) {
      // Check if user is trying to modify times
      if (startTime !== originalStartTime) {
        return {
          isValid: false,
          error: 'Không thể thay đổi thời gian của chiến dịch đã bắt đầu'
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Validate flash sale slots
 */
export const validateFlashSlots = (
  flashSlots: FlashSlot[],
  campaignStartTime: string,
  campaignEndTime: string,
  isEdit: boolean = false,
  campaignStatus?: string
): CampaignValidationResult => {
  if (flashSlots.length === 0) {
    return {
      isValid: false,
      error: 'Flash Sale cần ít nhất 1 khung giờ'
    };
  }

  const campaignStart = new Date(campaignStartTime);
  const campaignEnd = new Date(campaignEndTime);
  const now = new Date();

  // Check if campaign has started (for edit mode)
  // Campaign status: DRAFT, ONOPEN, ACTIVE, EXPIRED, DISABLED
  const hasStarted = isEdit && campaignStatus && now >= campaignStart;

  for (let i = 0; i < flashSlots.length; i++) {
    const slot = flashSlots[i];

    // Validate required fields
    if (!slot.openTime || !slot.closeTime) {
      return {
        isValid: false,
        error: `Vui lòng điền đầy đủ thời gian cho khung giờ ${i + 1}`
      };
    }

    const slotOpen = new Date(slot.openTime);
    const slotClose = new Date(slot.closeTime);

    // Validate slot open < close
    if (slotOpen >= slotClose) {
      return {
        isValid: false,
        error: `Khung giờ ${i + 1}: Thời gian mở phải nhỏ hơn thời gian đóng`
      };
    }

    // 4. Validate slots are within campaign time range
    if (slotOpen < campaignStart) {
      return {
        isValid: false,
        error: `Khung giờ ${i + 1} bắt đầu trước khi chiến dịch bắt đầu`
      };
    }

    if (slotClose > campaignEnd) {
      return {
        isValid: false,
        error: `Khung giờ ${i + 1} kết thúc sau khi chiến dịch kết thúc`
      };
    }

    // Don't allow modifying slots if campaign has started
    // Campaign status: DRAFT, ONOPEN, ACTIVE, EXPIRED, DISABLED
    if (hasStarted && (campaignStatus === 'ACTIVE' || campaignStatus === 'EXPIRED' || campaignStatus === 'DISABLED')) {
      return {
        isValid: false,
        error: 'Không thể thay đổi khung giờ của chiến dịch đã bắt đầu'
      };
    }

    // 4. Check for overlapping slots
    for (let j = i + 1; j < flashSlots.length; j++) {
      const otherSlot = flashSlots[j];
      if (!otherSlot.openTime || !otherSlot.closeTime) continue;

      const otherOpen = new Date(otherSlot.openTime);
      const otherClose = new Date(otherSlot.closeTime);

      // Check if slots overlap
      const overlaps = (
        (slotOpen < otherClose && slotClose > otherOpen) ||
        (otherOpen < slotClose && otherClose > slotOpen)
      );

      if (overlaps) {
        return {
          isValid: false,
          error: `Khung giờ ${i + 1} và khung giờ ${j + 1} bị trùng lặp thời gian`
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Check if campaign has started (for UI state)
 */
export const hasCampaignStarted = (startTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  return now >= start;
};

/**
 * Check if campaign has ended (for UI state)
 */
export const hasCampaignEnded = (endTime: string): boolean => {
  const now = new Date();
  const end = new Date(endTime);
  return now >= end;
};

/**
 * Get campaign status based on times
 */
export const getCampaignTimeStatus = (startTime: string, endTime: string): 'DRAFT' | 'ONOPEN' | 'ACTIVE' | 'EXPIRED' => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return 'ONOPEN'; // Scheduled/upcoming
  if (now > end) return 'EXPIRED';
  return 'ACTIVE';
};

/**
 * Get minimum datetime for datetime-local input (current time)
 * Returns format: YYYY-MM-DDTHH:mm
 */
export const getMinDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
