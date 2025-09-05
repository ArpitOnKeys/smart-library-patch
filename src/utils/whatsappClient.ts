/**
 * WhatsApp Desktop Deep Link Client
 * Handles opening WhatsApp Desktop with full automation via Tauri
 */

import { formatForWhatsApp } from './phone';

// @ts-ignore
const { invoke } = window.__TAURI__?.tauri || { invoke: null };

export interface SendResult {
  success: boolean;
  method?: string;
  error?: string;
}

/**
 * Check if WhatsApp Desktop is available via Tauri command
 */
export async function checkWhatsAppDesktopAvailability(): Promise<boolean> {
  if (invoke) {
    try {
      return await invoke('check_whatsapp_desktop');
    } catch (error) {
      console.warn('Failed to check WhatsApp Desktop availability:', error);
    }
  }
  
  // Fallback for web version - assume available
  return true;
}

/**
 * Open WhatsApp Desktop with automated sending via Tauri
 * Uses Tauri backend for full automation including keyboard events
 */
export async function openDeepLink(phoneE164: string, text: string): Promise<SendResult> {
  const phoneForLink = formatForWhatsApp(phoneE164);
  
  if (!phoneForLink) {
    return {
      success: false,
      error: 'Invalid phone number format'
    };
  }

  // Try Tauri automated sending first (desktop app)
  if (invoke) {
    try {
      const result = await invoke('open_whatsapp_and_send', {
        phone: phoneForLink,
        message: text
      });
      
      console.log('WhatsApp message sent via Tauri automation');
      return {
        success: true,
        method: 'Tauri Automated Sending'
      };
    } catch (error) {
      console.warn('Tauri automated sending failed, falling back to manual methods:', error);
      // Continue to fallback methods below
    }
  }

  // Fallback methods for web version or if Tauri fails
  const encodedMessage = encodeURIComponent(text);
  
  const methods = [
    {
      name: 'WhatsApp Desktop Protocol',
      execute: () => {
        window.location.href = `whatsapp://send?phone=${phoneForLink}&text=${encodedMessage}`;
        return true;
      }
    },
    {
      name: 'WhatsApp Intent (Mobile)',
      execute: () => {
        window.location.href = `intent://send?phone=${phoneForLink}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
        return true;
      }
    },
    {
      name: 'Custom URL Scheme',
      execute: () => {
        const link = document.createElement('a');
        link.href = `whatsapp://send/?phone=${phoneForLink}&text=${encodedMessage}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
    },
    {
      name: 'WhatsApp Web',
      execute: () => {
        window.open(
          `https://web.whatsapp.com/send/?phone=${phoneForLink}&text=${encodedMessage}&type=phone_number&app_absent=0`,
          '_blank',
          'noopener,noreferrer'
        );
        return true;
      }
    },
    {
      name: 'wa.me Fallback',
      execute: () => {
        window.open(`https://wa.me/${phoneForLink}?text=${encodedMessage}`, '_blank');
        return true;
      }
    }
  ];
  
  // Try each fallback method
  for (const method of methods) {
    try {
      method.execute();
      console.log(`WhatsApp opened successfully using: ${method.name}`);
      
      return {
        success: true,
        method: method.name
      };
    } catch (error) {
      console.warn(`${method.name} failed:`, error);
      continue;
    }
  }
  
  // All methods failed
  return {
    success: false,
    error: 'All WhatsApp opening methods failed. Please ensure WhatsApp is installed.'
  };
}

/**
 * Send Enter key to WhatsApp (for manual fallback scenarios)
 */
export async function sendEnterKey(): Promise<SendResult> {
  if (invoke) {
    try {
      await invoke('simulate_key_press', { key: 'Enter' });
      return {
        success: true,
        method: 'Tauri Key Simulation'
      };
    } catch (error) {
      return {
        success: false,
        error: `Key simulation failed: ${error}`
      };
    }
  }
  
  return {
    success: false,
    error: 'Key simulation not available in web version'
  };
}

/**
 * Add jitter to delay (randomization to avoid rate limiting)
 */
export function addJitter(baseDelayMs: number, jitterPercent: number = 30): number {
  const jitterRange = baseDelayMs * (jitterPercent / 100);
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;
  return Math.max(1000, baseDelayMs + jitter); // Minimum 1 second
}

/**
 * Sleep utility for pacing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }
  
  throw lastError;
}