import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../utils/database';
import { generateToken, verifyToken } from '../utils/jwt';

// Types
interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user: TokenPayload;
}

interface SignupBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: UserResponse;
    token?: string;
  };
  error?: string;
  message?: string;
}

interface DatabaseResult {
  rows: any[];
  insertId?: string;
}

// Utility functions
const buildUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role
});

const handleAuthError = (error: unknown, res: Response, context: string): void => {
  console.error(`${context} error:`, error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const body: SignupBody = req.body;
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
      return;
    }

    const existingUser: DatabaseResult = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    const hashedPassword: string = await bcrypt.hash(password, 12);

    const result: DatabaseResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName, 'user']
    );

    const insertId: string | undefined = result.insertId || result.rows?.[0]?.insertId;
    
    if (!insertId) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
      return;
    }

    const userResult: DatabaseResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [insertId]
    );

    const user: User = userResult.rows[0] as User;
    const token: string = generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    const response: AuthResponse = {
      success: true,
      data: {
        user: buildUserResponse(user),
        token
      }
    };

    res.status(201).json(response);

  } catch (error) {
    handleAuthError(error, res, 'Signup');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body: LoginBody = req.body;
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    const result: DatabaseResult = await query(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const user: User = result.rows[0] as User;
    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const token: string = generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    const response: AuthResponse = {
      success: true,
      data: {
        user: buildUserResponse(user),
        token
      }
    };

    res.json(response);

  } catch (error) {
    handleAuthError(error, res, 'Login');
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;

    const result: DatabaseResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

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

export const logout = async (req: Request, res: Response): Promise<void> => {
  const response: AuthResponse = {
    success: true,
    message: 'Logged out successfully'
  };
  
  res.json(response);
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader: string | undefined = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
      return;
    }

    const token: string = authHeader.substring(7);
    const decoded: TokenPayload = verifyToken(token) as TokenPayload;
    
    const newToken: string = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    const response: AuthResponse = {
      success: true,
      data: { token: newToken }
    };

    res.json(response);

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};