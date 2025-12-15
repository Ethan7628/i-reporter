/**
 * Admin Routes
 * 
 * Protected routes for admin-only operations
 */

import express from 'express';
import { getAllUsers, getUserStats } from '../controllers/admin.controllers';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users with their report counts
router.get('/users', getAllUsers);

// Get user statistics
router.get('/stats', getUserStats);

export default router;
