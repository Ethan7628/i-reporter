import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  getUserReports,
  updateReport,
  deleteReport,
  updateReportStatus,
} from '../controllers/reports.controllers';
import { validateReport } from '../middleware/validation.middleware';
import { upload, handleUploadError } from '../utils/upload';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all report routes
router.use(authenticate);

// GET routes
router.get('/', getAllReports);
router.get('/user/:userId', getUserReports);
router.get('/:id', getReportById);

// POST routes with file upload (handles all media types: images, videos, audio)
router.post('/', upload.array('images', 4), handleUploadError, validateReport, createReport);

// PUT routes with file upload for updates (handles all media types: images, videos, audio)
router.put('/:id', upload.array('images', 4), handleUploadError, updateReport);

// PATCH routes (no file upload needed for status updates)
router.patch('/:id/status', updateReportStatus);

// DELETE routes
router.delete('/:id', deleteReport);

export default router;