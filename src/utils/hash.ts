/**
 * Password hashing and verification utilities for PATCH library system
 * Uses consistent hashing with salt for secure credential management
 * 
 * Changes made: Centralized hash/verify logic to fix credential update bug
 * where current password verification was failing due to inconsistent hashing
 * approach between storage and verification.
 * 
 * Updated to use bcryptjs for more secure password hashing while maintaining
 * backward compatibility with existing base64+salt encoded passwords.
 */

import bcrypt from 'bcryptjs';

const SALT = 'patch_salt_2024';
const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt (preferred) or fallback to base64+salt
 * @param password - Plain text password to hash
 * @param useBcrypt - Whether to use bcrypt (default: true)
 * @returns Hashed password string
 */
export const hashPassword = (password: string, useBcrypt: boolean = true): string => {
  if (useBcrypt) {
    return bcrypt.hashSync(password, BCRYPT_ROUNDS);
  }
  // Fallback for backward compatibility
  return btoa(password + SALT);
};

/**
 * Verify a password against a stored hash (supports both bcrypt and legacy format)
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export const verifyPassword = (password: string, hash: string): boolean => {
  try {
    // Check if it's a bcrypt hash (starts with $2)
    if (hash.startsWith('$2')) {
      return bcrypt.compareSync(password, hash);
    }
    
    // Legacy base64+salt verification
    const decrypted = atob(hash);
    return decrypted === password + SALT;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

/**
 * Decrypt a password hash (for backward compatibility)
 * @param hash - Hashed password
 * @returns Decrypted password or empty string if failed
 */
export const decryptPassword = (hash: string): string => {
  try {
    return atob(hash).replace(SALT, '');
  } catch {
    return '';
  }
};

/**
 * Check if a string looks like a hashed password
 * @param value - String to check
 * @returns True if appears to be a hash, false if plaintext
 */
export const isHashedPassword = (value: string): boolean => {
  try {
    const decoded = atob(value);
    return decoded.includes(SALT);
  } catch {
    return false;
  }
};

/**
 * Get password strength score (0-4)
 * @param password - Password to evaluate
 * @returns Strength score and feedback
 */
export const getPasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  return { score: Math.min(score, 4), feedback };
};