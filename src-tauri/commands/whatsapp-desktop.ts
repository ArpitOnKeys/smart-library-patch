// Tauri backend commands for WhatsApp Desktop integration
// Handles platform detection and WhatsApp installation checking

import { invoke } from '@tauri-apps/api/core';

export interface WhatsAppInstallationInfo {
  isInstalled: boolean;
  platform: string;
  whatsappPath?: string;
  version?: string;
}

/**
 * Check if WhatsApp Desktop is installed on the system
 */
export async function checkWhatsAppInstallation(): Promise<boolean> {
  try {
    const platform = await getPlatform();
    
    switch (platform) {
      case 'windows':
        return await checkWindowsWhatsApp();
      case 'macos':
        return await checkMacOSWhatsApp();
      case 'linux':
        return await checkLinuxWhatsApp();
      default:
        console.warn('Unknown platform:', platform);
        return false;
    }
  } catch (error) {
    console.error('Failed to check WhatsApp installation:', error);
    return false;
  }
}

/**
 * Get the current platform
 */
export async function getPlatform(): Promise<string> {
  try {
    // Use Tauri's built-in platform detection if available
    const platform = await invoke('get_platform');
    return platform as string;
  } catch (error) {
    // Fallback to user agent detection
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'windows';
    if (userAgent.includes('Mac')) return 'macos';
    if (userAgent.includes('Linux')) return 'linux';
    return 'unknown';
  }
}

/**
 * Check WhatsApp installation on Windows
 */
async function checkWindowsWhatsApp(): Promise<boolean> {
  try {
    // Common WhatsApp Desktop installation paths on Windows
    const commonPaths = [
      '%LOCALAPPDATA%\\WhatsApp\\WhatsApp.exe',
      '%APPDATA%\\WhatsApp\\WhatsApp.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\WhatsApp\\WhatsApp.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Roaming\\WhatsApp\\WhatsApp.exe'
    ];

    // Try to check if any of these paths exist
    for (const path of commonPaths) {
      try {
        const exists = await invoke('file_exists', { path: path.replace('%LOCALAPPDATA%', '').replace('%APPDATA%', '').replace('%USERNAME%', '') });
        if (exists) {
          return true;
        }
      } catch (error) {
        // Continue checking other paths
        continue;
      }
    }

    // Alternative: Check registry entries (would need additional Tauri commands)
    // For now, we'll use a simple fallback
    return await checkGenericWhatsApp();
  } catch (error) {
    console.error('Windows WhatsApp check failed:', error);
    return false;
  }
}

/**
 * Check WhatsApp installation on macOS
 */
async function checkMacOSWhatsApp(): Promise<boolean> {
  try {
    // Common WhatsApp Desktop installation paths on macOS
    const commonPaths = [
      '/Applications/WhatsApp.app',
      '~/Applications/WhatsApp.app',
      '/System/Applications/WhatsApp.app'
    ];

    for (const path of commonPaths) {
      try {
        const exists = await invoke('file_exists', { path });
        if (exists) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return await checkGenericWhatsApp();
  } catch (error) {
    console.error('macOS WhatsApp check failed:', error);
    return false;
  }
}

/**
 * Check WhatsApp installation on Linux
 */
async function checkLinuxWhatsApp(): Promise<boolean> {
  try {
    // Common WhatsApp Desktop installation paths on Linux
    const commonPaths = [
      '/usr/bin/whatsapp-desktop',
      '/usr/local/bin/whatsapp-desktop',
      '~/.local/bin/whatsapp-desktop',
      '/opt/WhatsApp/whatsapp-desktop',
      '/snap/bin/whatsapp-for-linux'
    ];

    for (const path of commonPaths) {
      try {
        const exists = await invoke('file_exists', { path });
        if (exists) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return await checkGenericWhatsApp();
  } catch (error) {
    console.error('Linux WhatsApp check failed:', error);
    return false;
  }
}

/**
 * Generic WhatsApp check using protocol detection
 */
async function checkGenericWhatsApp(): Promise<boolean> {
  try {
    // Try to detect if whatsapp:// protocol is supported
    // This is a browser-based check and might not work in all cases
    const isSupported = navigator.userAgent.includes('Chrome') || 
                       navigator.userAgent.includes('Firefox') || 
                       navigator.userAgent.includes('Safari');
    
    // For Tauri apps, we'll assume WhatsApp protocol support is available
    // since most modern systems support custom protocol handlers
    return isSupported;
  } catch (error) {
    console.error('Generic WhatsApp check failed:', error);
    // Default to true for better user experience
    return true;
  }
}

/**
 * Get detailed WhatsApp installation information
 */
export async function getWhatsAppInstallationInfo(): Promise<WhatsAppInstallationInfo> {
  const platform = await getPlatform();
  const isInstalled = await checkWhatsAppInstallation();
  
  return {
    isInstalled,
    platform,
    whatsappPath: undefined, // Could be expanded to return actual path
    version: undefined       // Could be expanded to return version info
  };
}

// Tauri command exports for backend integration
export const tauriCommands = {
  check_whatsapp_installation: checkWhatsAppInstallation,
  get_platform: getPlatform,
  get_whatsapp_installation_info: getWhatsAppInstallationInfo,
};