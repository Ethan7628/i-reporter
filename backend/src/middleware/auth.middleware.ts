import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Alias for authenticateToken to maintain compatibility
export const authenticateToken = authenticate;

// Optional: Admin-only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }
  next();
};