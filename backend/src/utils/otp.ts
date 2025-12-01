/**
 * OTP (One-Time Password) Management Utility
 * 
 * Handles in-memory storage of OTP codes with expiration
 * OTPs are temporary and automatically expire after 10 minutes
 */

// Interface for OTP data structure
interface OTPData {
  code: string;        // 6-digit OTP code
  expiresAt: number;   // Timestamp when OTP expires (Unix time in milliseconds)
  email: string;       // Email address associated with this OTP
  userData: {          // User information temporarily stored until OTP verification
    firstName: string;
    lastName: string;
    password: string;  // Already hashed password
  };
}

/**
 * In-memory storage for OTP codes
 * Key: email address
 * Value: OTP data including code, expiration time, and user info
 * 
 * Note: This is cleared when server restarts. For production,
 * consider using Redis or database storage for persistence.
 */
const otpStore: Map<string, OTPData> = new Map();

/**
 * Store OTP code with user data in memory
 * OTP automatically expires after 10 minutes
 * 
 * @param {string} email - User's email address (used as unique key)
 * @param {string} otp - 6-digit OTP code
 * @param {Object} userData - User registration data to store temporarily
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.password - User's HASHED password
 * 
 * @example
 * storeOTP('user@example.com', '123456', {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   password: '$2a$12$hashedpassword...'
 * });
 */
export const storeOTP = (
  email: string,
  otp: string,
  userData: { firstName: string; lastName: string; password: string }
): void => {
  // Calculate expiration time: current time + 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
  
  // Store OTP data in memory
  otpStore.set(email, {
    code: otp,
    expiresAt,
    email,
    userData,
  });
  
  console.log(`✅ OTP stored for ${email}, expires in 10 minutes`);
};

/**
 * Verify OTP code and retrieve user data if valid
 * 
 * Validation checks:
 * 1. OTP exists for the given email
 * 2. OTP matches the provided code
 * 3. OTP has not expired (within 10 minutes)
 * 
 * If verification succeeds, the OTP is automatically deleted
 * 
 * @param {string} email - User's email address
 * @param {string} otp - OTP code to verify
 * @returns {Object|null} User data if OTP is valid, null if invalid or expired
 * 
 * @example
 * const userData = verifyOTP('user@example.com', '123456');
 * if (userData) {
 *   // OTP is valid, proceed with user creation
 *   console.log(userData.firstName, userData.lastName);
 * } else {
 *   // OTP is invalid or expired
 *   console.log('Invalid or expired OTP');
 * }
 */
export const verifyOTP = (
  email: string,
  otp: string
): { firstName: string; lastName: string; password: string } | null => {
  // Retrieve OTP data from storage
  const otpData = otpStore.get(email);
  
  // Check if OTP exists for this email
  if (!otpData) {
    console.log(`❌ No OTP found for email: ${email}`);
    return null;
  }
  
  // Check if OTP has expired
  if (Date.now() > otpData.expiresAt) {
    console.log(`❌ OTP expired for email: ${email}`);
    // Clean up expired OTP from storage
    otpStore.delete(email);
    return null;
  }
  
  // Check if OTP code matches
  if (otpData.code !== otp) {
    console.log(`❌ Invalid OTP for email: ${email}`);
    return null;
  }
  
  // OTP is valid - delete it from storage (one-time use)
  console.log(`✅ OTP verified successfully for email: ${email}`);
  otpStore.delete(email);
  
  // Return user data for account creation
  return otpData.userData;
};

/**
 * Delete OTP from storage
 * Used when user needs to request a new OTP
 * 
 * @param {string} email - User's email address
 * 
 * @example
 * deleteOTP('user@example.com');
 */
export const deleteOTP = (email: string): void => {
  const deleted = otpStore.delete(email);
  if (deleted) {
    console.log(`✅ OTP deleted for email: ${email}`);
  } else {
    console.log(`ℹ️  No OTP to delete for email: ${email}`);
  }
};

/**
 * Cleanup expired OTPs from storage
 * This function should be called periodically to free up memory
 * 
 * In production, consider running this as a scheduled job (cron)
 * or use a database with TTL (Time To Live) features like Redis
 */
export const cleanupExpiredOTPs = (): void => {
  const now = Date.now();
  let cleanedCount = 0;
  
  // Iterate through all stored OTPs
  for (const [email, otpData] of otpStore.entries()) {
    // Delete if expired
    if (now > otpData.expiresAt) {
      otpStore.delete(email);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired OTP(s)`);
  }
};

// Setup periodic cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
