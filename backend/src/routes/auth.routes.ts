import express from 'express';
import { 
  signup, 
  login, 
  logout, 
  getCurrentUser, 
  refreshToken 
} from '../controllers/auth.controllers';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateSignup, validateLogin } from '../middleware/validation.middleware';

const router = express.Router();

// Public routes with validation
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/refresh', refreshToken);

export default router;