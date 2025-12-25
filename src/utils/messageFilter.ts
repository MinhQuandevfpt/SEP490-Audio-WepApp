/**
 * Utility functions to filter sensitive information from chat messages
 */

/**
 * Remove Vietnamese diacritics (accents) from text
 */
function removeVietnameseDiacritics(text: string): string {
  const diacriticsMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
  };

  let result = text.toLowerCase();
  for (const [accented, unaccented] of Object.entries(diacriticsMap)) {
    result = result.replace(new RegExp(accented, 'g'), unaccented);
  }
  return result;
}

/**
 * Normalize Vietnamese number words to digits (with and without diacritics)
 */
function normalizeVietnameseNumbers(text: string): string {
  // Vietnamese number words mapping (with diacritics)
  const vietnameseNumbersWithDiacritics: { [key: string]: string } = {
    'không': '0', 'ko': '0', 'k': '0',
    'một': '1', 'mốt': '1',
    'hai': '2',
    'ba': '3',
    'bốn': '4',
    'năm': '5', 'lăm': '5',
    'sáu': '6',
    'bảy': '7',
    'tám': '8',
    'chín': '9',
  };

  // Vietnamese number words without diacritics
  const vietnameseNumbersWithoutDiacritics: { [key: string]: string } = {
    'khong': '0',
    'mot': '1',
    'bon': '4',
    'nam': '5', 'lam': '5',
    'sau': '6',
    'bay': '7',
    'tam': '8',
    'chin': '9',
  };

  let normalized = text.toLowerCase();
  
  // First, try matching with diacritics
  for (const [word, digit] of Object.entries(vietnameseNumbersWithDiacritics)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, digit);
  }
  
  // Then, try matching without diacritics (for text that's already without diacritics)
  for (const [word, digit] of Object.entries(vietnameseNumbersWithoutDiacritics)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, digit);
  }
  
  // Also normalize text without diacritics and check
  const textWithoutDiacritics = removeVietnameseDiacritics(text.toLowerCase());
  if (textWithoutDiacritics !== normalized) {
    let normalizedNoDiacritics = textWithoutDiacritics;
    for (const [word, digit] of Object.entries(vietnameseNumbersWithoutDiacritics)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalizedNoDiacritics = normalizedNoDiacritics.replace(regex, digit);
    }
    // Merge results - if we found more digits in no-diacritics version, use that
    const digitsWithDiacritics = normalized.match(/[0-9]/g) || [];
    const digitsNoDiacritics = normalizedNoDiacritics.match(/[0-9]/g) || [];
    if (digitsNoDiacritics.length > digitsWithDiacritics.length) {
      normalized = normalizedNoDiacritics;
    }
  }
  
  return normalized;
}

/**
 * Normalize English number words to digits
 */
function normalizeEnglishNumbers(text: string): string {
  const englishNumbers: { [key: string]: string } = {
    'zero': '0', 'oh': '0', 'o': '0',
    'one': '1',
    'two': '2', 'to': '2', 'too': '2',
    'three': '3',
    'four': '4', 'for': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8', 'ate': '8',
    'nine': '9',
  };

  let normalized = text.toLowerCase();
  for (const [word, digit] of Object.entries(englishNumbers)) {
    // Replace whole words only (with word boundaries)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, digit);
  }
  return normalized;
}

/**
 * Extract and normalize phone number patterns from text
 * Handles mixed text and numbers (e.g., "chín năm 2 sau 567 tám 9")
 */
function extractPhonePattern(text: string): string {
  // First normalize number words to digits (keep original structure)
  let normalized = normalizeVietnameseNumbers(text);
  normalized = normalizeEnglishNumbers(normalized);
  
  // Remove common separators, spaces, and non-digit characters (except digits)
  // But keep the structure to detect patterns
  let cleaned = normalized.replace(/[\s\-\.\(\)\*\_]/g, '');
  
  return cleaned;
}

/**
 * Find position in original text corresponding to position in text without diacritics
 */
function findPositionInOriginal(originalText: string, posInNoDiacritics: number): number {
  const originalLower = originalText.toLowerCase();
  const noDiacritics = removeVietnameseDiacritics(originalLower);
  
  if (posInNoDiacritics >= noDiacritics.length) {
    return -1;
  }
  
  // Try to find corresponding position in original text
  // This is a simple approach - map character by character
  let pos = 0;
  let noDiacriticsPos = 0;
  
  while (pos < originalLower.length && noDiacriticsPos < posInNoDiacritics) {
    const char = originalLower[pos];
    const charNoDiacritics = removeVietnameseDiacritics(char);
    if (charNoDiacritics.length > 0) {
      noDiacriticsPos += charNoDiacritics.length;
    }
    pos++;
  }
  
  return pos < originalLower.length ? pos : -1;
}

/**
 * Extract all digits and number words from text, preserving order
 * Returns array of digits (as strings)
 * Handles mixed text like "chín năm 2 sau 567 tám 9" or "khong bay nam hai khong chin tam chin hai sau nam"
 */
function extractAllDigits(text: string): string[] {
  const lowerText = text.toLowerCase();
  
  // Vietnamese number words (with and without diacritics)
  const vietnameseNumbers: { [key: string]: string } = {
    // With diacritics
    'không': '0', 'ko': '0', 'k': '0',
    'một': '1', 'mốt': '1',
    'hai': '2',
    'ba': '3',
    'bốn': '4',
    'năm': '5', 'lăm': '5',
    'sáu': '6',
    'bảy': '7',
    'tám': '8',
    'chín': '9',
    // Without diacritics
    'khong': '0',
    'mot': '1',
    'bon': '4',
    'nam': '5', 'lam': '5',
    'sau': '6',
    'bay': '7',
    'tam': '8',
    'chin': '9',
  };
  
  // English number words
  const englishNumbers: { [key: string]: string } = {
    'zero': '0', 'oh': '0', 'o': '0',
    'one': '1',
    'two': '2', 'to': '2', 'too': '2',
    'three': '3',
    'four': '4', 'for': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8', 'ate': '8',
    'nine': '9',
  };
  
  // Create a combined map
  const allNumbers: { [key: string]: string } = {
    ...vietnameseNumbers,
    ...englishNumbers
  };
  
  // Find all matches with their positions
  const matches: Array<{ pos: number; digit: string }> = [];
  
  // Find numeric digits (preserve original case for position matching)
  for (let i = 0; i < text.length; i++) {
    if (/[0-9]/.test(text[i])) {
      matches.push({ pos: i, digit: text[i] });
    }
  }
  
  // Find number words (use lowerText for matching, but original text for position)
  for (const [word, digit] of Object.entries(allNumbers)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    // Reset regex lastIndex to avoid issues with global regex
    regex.lastIndex = 0;
    while ((match = regex.exec(lowerText)) !== null) {
      // Use match.index from lowerText (should match original text position)
      matches.push({ pos: match.index, digit });
    }
  }
  
  // Also check text without diacritics for Vietnamese words without diacritics
  const textWithoutDiacritics = removeVietnameseDiacritics(lowerText);
  if (textWithoutDiacritics !== lowerText) {
    // Only check Vietnamese words without diacritics
    const vietnameseWithoutDiacritics: { [key: string]: string } = {
      'khong': '0',
      'mot': '1',
      'bon': '4',
      'nam': '5', 'lam': '5',
      'sau': '6',
      'bay': '7',
      'tam': '8',
      'chin': '9',
    };
    
    for (const [word, digit] of Object.entries(vietnameseWithoutDiacritics)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(textWithoutDiacritics)) !== null) {
        // Find corresponding position in original text
        // This is approximate - we'll use the position from textWithoutDiacritics
        // and try to find it in original text
        const posInOriginal = findPositionInOriginal(text, match.index);
        if (posInOriginal !== -1) {
          matches.push({ pos: posInOriginal, digit });
        }
      }
    }
  }
  
  // Sort by position and extract digits (remove duplicates at same position)
  matches.sort((a, b) => a.pos - b.pos);
  
  // Remove duplicates at same position (keep first)
  const uniqueMatches: Array<{ pos: number; digit: string }> = [];
  const seenPositions = new Set<number>();
  for (const match of matches) {
    if (!seenPositions.has(match.pos)) {
      uniqueMatches.push(match);
      seenPositions.add(match.pos);
    }
  }
  
  return uniqueMatches.map(m => m.digit);
}

/**
 * Check if text contains phone-related keywords
 */
function containsPhoneKeywords(text: string): boolean {
  const phoneKeywords = [
    // Vietnamese
    'sdt', 'số điện thoại', 'điện thoại', 'số phone', 'phone số',
    'gọi', 'gọi số', 'liên hệ', 'call', 'contact',
    'thêm số', 'thêm số 0', 'thêm số không', 'số 0 trước',
    'số không trước', 'thêm 0', 'thêm không',
    // English
    'phone', 'mobile', 'cell', 'call me', 'contact me',
    'add zero', 'add 0', 'zero before', '0 before',
  ];
  
  const lowerText = text.toLowerCase();
  for (const keyword of phoneKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if text contains a phone number pattern (after normalization)
 */
function containsPhonePattern(text: string): boolean {
  // First check direct numeric patterns
  const directPhoneRegex = /(\+?84|0)[1-9][0-9]{8,9}|(\+?84|0)[\s\-\.]?[1-9][\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{3,4}/g;
  if (directPhoneRegex.test(text)) {
    return true;
  }

  // Extract all digits (from both numbers and words) in order
  const allDigits = extractAllDigits(text);
  const digitString = allDigits.join('');
  
  // Check if we have 9-11 digits (phone number length)
  if (allDigits.length >= 9 && allDigits.length <= 11) {
    // Check if it starts with 0, +84, or Vietnamese phone prefix (3, 5, 7, 8, 9)
    const fullPattern = digitString;
    
    // Pattern 1: Starts with 0 or +84
    if (/^(\+?84|0)[1-9][0-9]{8,9}$/.test(fullPattern)) {
      return true;
    }
    
    // Pattern 2: 9-10 digits starting with 3, 5, 7, 8, 9 (Vietnamese phone)
    if (/^[35789][0-9]{8,9}$/.test(fullPattern)) {
      return true;
    }
    
    // Pattern 3: If text contains phone keywords, be more lenient
    if (containsPhoneKeywords(text)) {
      // If has 9-10 digits and phone keywords, likely a phone number
      if (allDigits.length >= 9 && allDigits.length <= 10) {
        return true;
      }
    }
  }

  // Check for patterns with separators but mixed content
  // e.g., "chín năm 2 sau 567 tám 9"
  const normalized = extractPhonePattern(text);
  const normalizedPhoneRegex = /(\+?84|0)[1-9][0-9]{8,9}/;
  if (normalizedPhoneRegex.test(normalized)) {
    return true;
  }

  // Check for sequences of 9-10 consecutive digits (potential phone without leading 0)
  const consecutiveDigits = /[0-9]{9,10}/;
  if (consecutiveDigits.test(normalized)) {
    const match = normalized.match(/[0-9]{9,10}/);
    if (match) {
      const digits = match[0];
      // Vietnamese phone numbers typically start with 3, 5, 7, 8, 9
      if (/^[35789]/.test(digits)) {
        return true;
      }
    }
  }

  // Check for patterns like "không ba năm hai..." or "khong bay nam hai..." (Vietnamese written numbers)
  // Match sequences of 8+ Vietnamese number words (flexible spacing, allow other words in between)
  // Include both with and without diacritics
  const vietnameseNumberWords = '(không|khong|ko|k|một|mot|mốt|hai|ba|bốn|bon|năm|nam|lăm|lam|sáu|sau|bảy|bay|tám|tam|chín|chin)';
  // Allow up to 2 non-number words between number words
  const vietnamesePhonePattern = new RegExp(
    `(?:\\b${vietnameseNumberWords}\\b\\s*(?:\\w+\\s*){0,2}){8,}`,
    'gi'
  );
  if (vietnamesePhonePattern.test(text)) {
    return true;
  }
  
  // Also check text without diacritics for patterns
  const textWithoutDiacritics = removeVietnameseDiacritics(text);
  if (textWithoutDiacritics !== text.toLowerCase()) {
    const vietnamesePhonePatternNoDiacritics = new RegExp(
      `(?:\\b${vietnameseNumberWords}\\b\\s*(?:\\w+\\s*){0,2}){8,}`,
      'gi'
    );
    if (vietnamesePhonePatternNoDiacritics.test(textWithoutDiacritics)) {
      return true;
    }
  }

  // Check for patterns like "zero three two..." (English written numbers)
  const englishNumberWords = '(zero|oh|o|one|two|to|too|three|four|for|five|six|seven|eight|ate|nine)';
  const englishPhonePattern = new RegExp(
    `(?:\\b${englishNumberWords}\\b\\s*(?:\\w+\\s*){0,2}){8,}`,
    'gi'
  );
  if (englishPhonePattern.test(text)) {
    return true;
  }

  // Check for mixed patterns: numbers and words together
  // e.g., "chín năm 2 sau 567 tám 9"
  // Pattern: at least 8 digits (from numbers or words) with optional text in between
  if (allDigits.length >= 8) {
    // Check if the digits form a valid phone pattern
    const digitStr = allDigits.join('');
    
    // If starts with 0 or +84
    if (/^(\+?84|0)[1-9][0-9]{7,9}$/.test(digitStr)) {
      return true;
    }
    
    // If 9-10 digits starting with 3, 5, 7, 8, 9
    if (/^[35789][0-9]{8,9}$/.test(digitStr)) {
      return true;
    }
    
    // If has phone keywords and 8+ digits, likely phone
    if (containsPhoneKeywords(text) && allDigits.length >= 8) {
      return true;
    }
  }

  // Check for mixed patterns (numbers with separators like *, -, ., space)
  // e.g., "0*1*2*3", "0-1-2-3", "0.1.2.3", "0 1 2 3"
  const mixedSeparatorPattern = /[0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_][0-9][\s\*\-\.\_]?[0-9]?/;
  if (mixedSeparatorPattern.test(text)) {
    const cleaned = text.replace(/[\s\*\-\.\_]/g, '');
    if (/^(\+?84|0)[1-9][0-9]{8,9}$/.test(cleaned)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains email patterns (including spaced variations)
 */
function containsEmailPattern(text: string): boolean {
  // Standard email pattern
  const standardEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (standardEmailRegex.test(text)) {
    return true;
  }

  // Email with spaces (e.g., "email @ domain . com")
  const spacedEmailRegex = /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/gi;
  if (spacedEmailRegex.test(text)) {
    return true;
  }

  // Email written as words (e.g., "email at domain dot com")
  const wordEmailRegex = /\b[a-zA-Z0-9._%+-]+\s+(at|@)\s+[a-zA-Z0-9.-]+\s+(dot|\.)\s+[a-zA-Z]{2,}\b/gi;
  if (wordEmailRegex.test(text)) {
    return true;
  }

  // Email with Vietnamese words (e.g., "email tại domain chấm com")
  const vietnameseEmailRegex = /\b[a-zA-Z0-9._%+-]+\s+(tại|@)\s+[a-zA-Z0-9.-]+\s+(chấm|\.)\s+[a-zA-Z]{2,}\b/gi;
  if (vietnameseEmailRegex.test(text)) {
    return true;
  }

  return false;
}

/**
 * Check if text contains URL patterns (including spaced variations)
 */
function containsURLPattern(text: string): boolean {
  // Standard URL patterns
  const standardURLRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  if (standardURLRegex.test(text)) {
    return true;
  }

  // URL with spaces (e.g., "www . example . com")
  const spacedURLRegex = /(?:https?:\/\/)?(?:www\s*\.\s*)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\s*\.\s*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\s*\.\s*[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  if (spacedURLRegex.test(text)) {
    return true;
  }

  // Facebook links with variations
  const facebookVariations = [
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:facebook|fb)\.com\/[^\s]+/gi,
    /(?:https?:\/\/)?(?:www\s*\.\s*)?(?:m\s*\.\s*)?(?:facebook|fb)\s*\.\s*com\s*\/\s*[^\s]+/gi,
    /\b(?:facebook|fb)\s*\.\s*com\s*\/\s*[^\s]+/gi,
  ];
  for (const regex of facebookVariations) {
    if (regex.test(text)) {
      return true;
    }
  }

  // Common domain patterns with spaces
  const commonDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'zalo', 'telegram', 'whatsapp', 'instagram', 'twitter', 'youtube', 'tiktok'];
  for (const domain of commonDomains) {
    const domainRegex = new RegExp(`\\b${domain}\\s*\\.\\s*(com|net|org|vn|io|me)`, 'gi');
    if (domainRegex.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a message contains sensitive information that should be blocked
 * @param content - The message content to check
 * @returns true if the message should be blocked, false otherwise
 */
export function containsSensitiveInfo(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const text = content.trim();

  // Check for phone numbers (including written forms)
  if (containsPhonePattern(text)) {
    return true;
  }

  // Check for email addresses (including spaced variations)
  if (containsEmailPattern(text)) {
    return true;
  }

  // Check for URLs (including spaced variations)
  if (containsURLPattern(text)) {
    return true;
  }

  return false;
}

/**
 * Filter a message - returns null if message should be blocked, otherwise returns the message
 * @param message - The message object
 * @returns The message if safe, null if blocked
 */
export function filterMessage<T extends { content?: string }>(message: T): T | null {
  if (!message.content) {
    return message; // Messages without text content are allowed (images, videos, etc.)
  }

  if (containsSensitiveInfo(message.content)) {
    return null; // Block the message
  }

  return message; // Allow the message
}

/**
 * Filter an array of messages
 * @param messages - Array of messages to filter
 * @returns Filtered array of messages (blocked messages are removed)
 */
export function filterMessages<T extends { content?: string }>(messages: T[]): T[] {
  return messages.filter((msg) => filterMessage(msg) !== null);
}

