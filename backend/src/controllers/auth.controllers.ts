/**
 * Authentication Controllers
 * 
 * Handles user authentication operations including:
 * - User registration with OTP email verification
 * - User login with JWT token generation
 * - Getting current user information
 * - Logout operations
 * - Token refresh
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../utils/database';
import { generateToken, verifyToken } from '../utils/jwt';
import { generateOTP, sendOTPEmail } from '../utils/email';
import { storeOTP, verifyOTP } from '../utils/otp';

// ==================== TYPE DEFINITIONS ====================

/**
 * Database user object structure
 */
interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at?: string;
}

/**
 * JWT token payload structure
 * Contains user identification and role information
 */
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extended Express request with authenticated user data
 * Used in protected routes that require authentication
 */
interface AuthRequest extends Request {
  user: TokenPayload;
}

/**
 * Request body for user signup (initial step)
 * User provides registration details, server sends OTP
 */
interface SignupBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Request body for OTP verification (second step)
 * User provides OTP code to complete registration
 */
interface VerifyOTPBody {
  email: string;
  otp: string;
}

/**
 * Request body for user login
 */
interface LoginBody {
  email: string;
  password: string;
}

/**
 * Formatted user response (excludes sensitive data like password)
 */
interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Standard authentication API response structure
 */
interface AuthResponse {
  success: boolean;
  data?: {
    user?: UserResponse;
    token?: string;
    message?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Database query result wrapper
 */
interface DatabaseResult {
  rows: any[];
  insertId?: string;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Build a safe user response object from database user
 * Removes sensitive information like password and formats field names
 * 
 * @param {User} user - Raw user object from database
 * @returns {UserResponse} Formatted user response
 */
const buildUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role
});

/**
 * Centralized error handler for authentication operations
 * Logs error details and sends consistent error response
 * 
 * @param {unknown} error - Error object from try-catch
 * @param {Response} res - Express response object
 * @param {string} context - Context description for logging (e.g., 'Signup', 'Login')
 */
const handleAuthError = (error: unknown, res: Response, context: string): void => {
  console.error(`❌ ${context} error:`, error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

// ==================== CONTROLLER FUNCTIONS ====================

/**
 * STEP 1: User Signup (Initial Registration)
 * 
 * Flow:
 * 1. Validate all required fields are present
 * 2. Check if user already exists in database
 * 3. Hash the password using bcrypt
 * 4. Generate a 6-digit OTP code
 * 5. Store OTP and user data temporarily (10 min expiry)
 * 6. Send OTP via email to user
 * 7. Return success message (user not created yet)
 * 
 * User must verify OTP in the next step to complete registration
 * 
 * @route POST /api/auth/signup
 * @param {Request} req - Express request with signup data in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract and validate request body
    const body: SignupBody = req.body;
    const { email, password, firstName, lastName } = body;

    // Validate that all required fields are provided
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'All fields are required (email, password, firstName, lastName)'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Check if user already exists in database
    const existingUser: DatabaseResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }

    // Hash password using bcrypt (salt rounds = 12 for security)
    // Higher salt rounds = more secure but slower processing
    const hashedPassword: string = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP code
    const otp = generateOTP();

    // Store OTP and user data temporarily (expires in 10 minutes)
    storeOTP(email, otp, {
      firstName,
      lastName,
      password: hashedPassword,
    });

    // Send OTP via email to user
    const emailSent = await sendOTPEmail(email, otp, firstName);

    if (!emailSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
      return;
    }

    // Respond with success (user not created yet, awaiting OTP verification)
    res.status(200).json({
      success: true,
      data: {
        message: 'OTP sent to your email. Please verify to complete registration.'
      }
    });

    console.log(`✅ OTP sent successfully to: ${email}`);
  } catch (error) {
    handleAuthError(error, res, 'Signup');
  }
};

/**
 * STEP 2: Verify OTP and Complete Registration
 * 
 * Flow:
 * 1. Validate email and OTP are provided
 * 2. Verify OTP against stored data
 * 3. Check OTP expiration (must be within 10 minutes)
 * 4. Determine user role (admin or regular user)
 * 5. Insert user into database
 * 6. Generate JWT token for automatic login
 * 7. Return user data and token
 * 
 * @route POST /api/auth/verify-otp
 * @param {Request} req - Express request with email and OTP in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const verifyOTPAndCreateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract email and OTP from request body
    const body: VerifyOTPBody = req.body;
    const { email, otp } = body;

    // Validate required fields
    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
      return;
    }

    // Verify OTP and retrieve stored user data
    const userData = verifyOTP(email, otp);

    // Check if OTP is valid and not expired
    if (!userData) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new one.'
      });
      return;
    }

    // Determine user role
    // Admin email is hardcoded for this demo
    // In production, consider database configuration or environment variable
    const ADMIN_EMAIL = 'kusasirakweethan31@gmail.com';
    const roleToSet = email === ADMIN_EMAIL ? 'admin' : 'user';

    // Insert new user into database with verified email
    const result: DatabaseResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, userData.password, userData.firstName, userData.lastName, roleToSet]
    );

    // Retrieve the newly created user from database
    const userResult: DatabaseResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );

    // Verify user was created successfully
    if (!userResult.rows || userResult.rows.length === 0) {
      res.status(500).json({
        success: false,
        error: 'User created but failed to retrieve user data'
      });
      return;
    }

    // Extract user data from database result
    const user: User = userResult.rows[0] as User;
    
    // Generate JWT token for automatic login
    const token: string = generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Prepare successful response
    const response: AuthResponse = {
      success: true,
      data: {
        user: buildUserResponse(user),
        token
      }
    };

    res.status(201).json(response);
    console.log(`✅ User account created successfully: ${email}`);
  } catch (error) {
    handleAuthError(error, res, 'OTP Verification');
  }
};

/**
 * User Login
 * 
 * Flow:
 * 1. Validate email and password are provided
 * 2. Find user by email in database
 * 3. Verify password using bcrypt comparison
 * 4. Check for admin email and promote if necessary
 * 5. Generate JWT token for session
 * 6. Return user data and token
 * 
 * @route POST /api/auth/login
 * @param {Request} req - Express request with login credentials in body
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract login credentials from request body
    const body: LoginBody = req.body;
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Find user by email in database
    const result: DatabaseResult = await query(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const user: User = result.rows[0] as User;

    // Check and promote admin if necessary
    // This allows promoting a user to admin by email
    const ADMIN_EMAIL = 'kusasirakweethan31@gmail.com';
    if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
      await query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
      user.role = 'admin';
      console.log(`✅ User promoted to admin: ${email}`);
    }

    // Verify password using bcrypt
    // bcrypt.compare() handles the hashing internally
    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token for authenticated session
    const token: string = generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Prepare successful login response
    const response: AuthResponse = {
      success: true,
      data: {
        user: buildUserResponse(user),
        token
      }
    };

    res.json(response);
    console.log(`✅ User logged in successfully: ${email}`);
  } catch (error) {
    handleAuthError(error, res, 'Login');
  }
};

/**
 * Get Current Authenticated User
 * 
 * Protected route that returns the currently logged-in user's information
 * Requires valid JWT token in Authorization header
 * 
 * @route GET /api/auth/me
 * @param {Request} req - Express request (contains user from auth middleware)
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract user ID from authenticated request
    // This is set by the authenticate middleware after verifying JWT
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;

    // Fetch user data from database
    const result: DatabaseResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [userId]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Extract user data and build response
    const user: User = result.rows[0] as User;
    const response: AuthResponse = {
      success: true,
      data: {
        user: buildUserResponse(user)
      }
    };

    res.json(response);
  } catch (error) {
    handleAuthError(error, res, 'Get current user');
  }
};

/**
 * User Logout
 * 
 * In JWT-based authentication, logout is handled on the client side
 * by removing the token from storage. This endpoint confirms logout.
 * 
 * For enhanced security, consider implementing:
 * - Token blacklisting in Redis
 * - Short-lived tokens with refresh tokens
 * 
 * @route POST /api/auth/logout
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // JWT tokens are stateless, so logout is primarily client-side
  // The client should remove the token from localStorage/cookies
  const response: AuthResponse = {
    success: true,
    message: 'Logged out successfully'
  };
  
  res.json(response);
  console.log('✅ User logged out');
};

/**
 * Refresh JWT Token
 * 
 * Generates a new JWT token using the current valid token
 * Useful for extending user sessions without requiring re-login
 * 
 * @route POST /api/auth/refresh
 * @param {Request} req - Express request with Authorization header
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract Authorization header
    const authHeader: string | undefined = req.headers.authorization;
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const token: string = authHeader.substring(7);
    
    // Verify current token and extract payload
    const decoded: TokenPayload = verifyToken(token) as TokenPayload;
    
    // Generate new token with same user data
    const newToken: string = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    // Return new token
    const response: AuthResponse = {
      success: true,
      data: { token: newToken }
    };

    res.json(response);
    console.log(`✅ Token refreshed for user: ${decoded.email}`);
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
