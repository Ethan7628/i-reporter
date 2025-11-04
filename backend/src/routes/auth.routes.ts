import express from 'express';
import { login, signup, getCurrentUser, logout } from '../controllers/auth.controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateLogin, validateSignup } from '../middleware/validation.middleware';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;