import express from 'express';
import { login, signup, verifyOTPAndCreateUser, getCurrentUser, logout } from '../controllers/auth.controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateLogin, validateSignup } from '../middleware/validation.middleware';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, signup); // Step 1: Send OTP
router.post('/verify-otp', verifyOTPAndCreateUser); // Step 2: Verify OTP and create user
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;