import express from 'express';
import { 
  createReport,
  getAllReports,
  getReportById,
  getUserReports,
  updateReport,
  deleteReport,
  updateReportStatus
} from '../controllers/reports.controllers';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateReport, validateStatusUpdate } from '../middleware/validation.middleware';
import { upload, handleUploadError } from '../utils/upload';

const router = express.Router();

// All report routes require authentication
router.use(authenticateToken);

// Report CRUD operations with validation
router.post('/', validateReport, createReport);
router.get('/', getAllReports);
router.get('/user/:userId', getUserReports);
router.get('/:id', getReportById);
router.put('/:id', validateReport, updateReport);
router.delete('/:id', deleteReport);

// Admin only routes with validation
router.patch('/:id/status', requireAdmin, validateStatusUpdate, updateReportStatus);
router.post('/:id/images', requireAdmin, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get the file URL/path
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update report with new image
    const { query } = await import('../utils/database.js');
    const result = await query(
      'UPDATE reports SET images = array_append(images, $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [fileUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const updatedReport = result.rows[0];

    res.json({
      success: true,
      data: {
        url: fileUrl,
        report: {
          id: updatedReport.id,
          userId: updatedReport.user_id,
          type: updatedReport.type,
          title: updatedReport.title,
          description: updatedReport.description,
          location: updatedReport.location,
          status: updatedReport.status,
          images: updatedReport.images,
          createdAt: updatedReport.created_at,
          updatedAt: updatedReport.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while uploading image'
    });
  }
});

export default router;