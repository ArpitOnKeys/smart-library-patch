/**
 * Phone Number Normalization and Validation
 * Handles E.164 formatting with Indian (+91) defaults
 */

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string | null;
  error?: string;
}

/**
 * Normalize phone number to E.164 format
 * @param phoneRaw - Raw phone number input
 * @param defaultCountry - Default country code (default: 'IN' for +91)
 * @returns E.164 formatted number or null if invalid
 */
export function normalizeToE164(phoneRaw: string, defaultCountry: string = 'IN'): string | null {
  if (!phoneRaw) return null;
  
  // Remove all non-digits
  const digits = phoneRaw.replace(/\D/g, '');
  
  if (!digits) return null;
  
  // Handle different patterns for Indian numbers
  if (defaultCountry === 'IN') {
    // Already has country code (91 prefix)
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    
    // Remove leading 0 if present (Indian format)
    const withoutLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
    
    // Standard 10-digit Indian mobile number
    if (withoutLeadingZero.length === 10) {
      // Validate Indian mobile number pattern (starts with 6-9)
      const firstDigit = withoutLeadingZero[0];
      if (['6', '7', '8', '9'].includes(firstDigit)) {
        return `+91${withoutLeadingZero}`;
      }
    }
    
    // Invalid length or pattern
    return null;
  }
  
  // For other countries, basic validation
  if (digits.length >= 10 && digits.length <= 15) {
    return digits.startsWith('+') ? digits : `+${digits}`;
  }
  
  return null;
}

/**
 * Validate phone number and return detailed result
 */
export function validatePhone(phoneRaw: string, defaultCountry: string = 'IN'): PhoneValidationResult {
  const e164 = normalizeToE164(phoneRaw, defaultCountry);
  
  if (!e164) {
    return {
      isValid: false,
      e164: null,
      error: 'Invalid phone number format'
    };
  }
  
  return {
    isValid: true,
    e164,
    error: undefined
  };
}

/**
 * Check if two phone numbers are likely duplicates
 */
export function isLikelyDuplicate(phoneA: string, phoneB: string): boolean {
  const normalizedA = normalizeToE164(phoneA);
  const normalizedB = normalizeToE164(phoneB);
  
  if (!normalizedA || !normalizedB) return false;
  
  return normalizedA === normalizedB;
}

/**
 * Format phone number for display (with country code)
 */
export function formatForDisplay(phoneRaw: string): string {
  const e164 = normalizeToE164(phoneRaw);
  if (!e164) return phoneRaw;
  
  // Format Indian numbers nicely
  if (e164.startsWith('+91')) {
    const number = e164.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  
  return e164;
}

/**
 * Extract just the digits for WhatsApp deep link (no + prefix)
 */
export function formatForWhatsApp(phoneRaw: string): string | null {
  const e164 = normalizeToE164(phoneRaw);
  if (!e164) return null;
  
  return e164.slice(1); // Remove the + prefix
}