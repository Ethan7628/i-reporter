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

    // Update report with new image (MySQL doesn't support array_append, use JSON operations)
    const { query } = await import('../utils/database.js');
    
    // First get current images
    const currentReport = await query('SELECT images FROM reports WHERE id = ?', [id]);
    if (currentReport.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const currentImages = currentReport.rows[0].images || [];
    const updatedImages = [...currentImages, fileUrl];
    
    const result = await query(
      'UPDATE reports SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedImages), id]
    );
    
    // Fetch updated report
    const updatedResult = await query('SELECT * FROM reports WHERE id = ?', [id]);

    const updatedReport = updatedResult.rows[0];

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