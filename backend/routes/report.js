import express from 'express';
import db from '../config/database.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { validateReport, validateStatusUpdate } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create report
router.post('/', validateReport, async (req, res) => {
  try {
    const { title, description, type, location } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `INSERT INTO reports (user_id, title, description, type, latitude, longitude) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description, type, location?.lat, location?.lng]
    );

    // Get the created report
    const reports = await db.query(
      `SELECT id, user_id, type, title, description, latitude, longitude, 
              status, images, created_at, updated_at 
       FROM reports WHERE id = ?`,
      [result.insertId]
    );

    const report = reports[0];

    res.status(201).json({
      success: true,
      data: {
        id: report.id,
        userId: report.user_id,
        type: report.type,
        title: report.title,
        description: report.description,
        location: {
          lat: report.latitude,
          lng: report.longitude
        },
        status: report.status,
        images: report.images ? JSON.parse(report.images) : [],
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating report'
    });
  }
});

// Get all reports (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let reports, totalCount;

    if (req.user.role === 'admin') {
      // Admin can see all reports
      reports = await db.query(
        `SELECT r.*, u.first_name, u.last_name, u.email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         ORDER BY r.created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      totalCount = await db.query('SELECT COUNT(*) as count FROM reports');
    } else {
      // Users can only see their own reports
      reports = await db.query(
        `SELECT * FROM reports 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset]
      );

      totalCount = await db.query(
        'SELECT COUNT(*) as count FROM reports WHERE user_id = ?',
        [req.user.id]
      );
    }

    const formattedReports = reports.map(report => ({
      id: report.id,
      userId: report.user_id,
      type: report.type,
      title: report.title,
      description: report.description,
      location: {
        lat: report.latitude,
        lng: report.longitude
      },
      status: report.status,
      images: report.images ? JSON.parse(report.images) : [],
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      // Include user info for admin
      ...(req.user.role === 'admin' && {
        user: {
          firstName: report.first_name,
          lastName: report.last_name,
          email: report.email
        }
      })
    }));

    res.json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching reports'
    });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;

    let report;
    if (req.user.role === 'admin') {
      const reports = await db.query(
        `SELECT r.*, u.first_name, u.last_name, u.email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = ?`,
        [reportId]
      );
      report = reports[0];
    } else {
      const reports = await db.query(
        'SELECT * FROM reports WHERE id = ? AND user_id = ?',
        [reportId, req.user.id]
      );
      report = reports[0];
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: report.id,
        userId: report.user_id,
        type: report.type,
        title: report.title,
        description: report.description,
        location: {
          lat: report.latitude,
          lng: report.longitude
        },
        status: report.status,
        images: report.images ? JSON.parse(report.images) : [],
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        ...(req.user.role === 'admin' && {
          user: {
            firstName: report.first_name,
            lastName: report.last_name,
            email: report.email
          }
        })
      }
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching report'
    });
  }
});

// Get user's reports
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only access their own reports, admins can access any
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const reports = await db.query(
      'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const formattedReports = reports.map(report => ({
      id: report.id,
      userId: report.user_id,
      type: report.type,
      title: report.title,
      description: report.description,
      location: {
        lat: report.latitude,
        lng: report.longitude
      },
      status: report.status,
      images: report.images ? JSON.parse(report.images) : [],
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));

    res.json({
      success: true,
      data: { reports: formattedReports }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user reports'
    });
  }
});

// Update report
router.patch('/:id', validateReport, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { title, description, type, location } = req.body;

    // Check if report exists and belongs to user
    const reports = await db.query(
      'SELECT * FROM reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reports[0];

    // Users can only edit their own reports, unless admin
    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if report can be edited (status is draft)
    if (report.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit report that is under investigation, rejected, or resolved'
      });
    }

    // Update report
    await db.query(
      `UPDATE reports 
       SET title = ?, description = ?, type = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, type, location?.lat, location?.lng, reportId]
    );

    // Get updated report
    const updatedReports = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const updatedReport = updatedReports[0];

    res.json({
      success: true,
      data: {
        id: updatedReport.id,
        userId: updatedReport.user_id,
        type: updatedReport.type,
        title: updatedReport.title,
        description: updatedReport.description,
        location: {
          lat: updatedReport.latitude,
          lng: updatedReport.longitude
        },
        status: updatedReport.status,
        images: updatedReport.images ? JSON.parse(updatedReport.images) : [],
        createdAt: updatedReport.created_at,
        updatedAt: updatedReport.updated_at
      }
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating report'
    });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;

    // Check if report exists
    const reports = await db.query(
      'SELECT * FROM reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = reports[0];

    // Users can only delete their own reports, unless admin
    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if report can be deleted (status is draft)
    if (report.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete report that is under investigation, rejected, or resolved'
      });
    }

    await db.query('DELETE FROM reports WHERE id = ?', [reportId]);

    res.json({
      success: true,
      data: { message: 'Report deleted successfully' }
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting report'
    });
  }
});

// Update report status (admin only)
router.patch('/:id/status', adminAuth, validateStatusUpdate, async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    // Check if report exists
    const reports = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Update status
    await db.query(
      'UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, reportId]
    );

    // Get updated report
    const updatedReports = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const updatedReport = updatedReports[0];

    res.json({
      success: true,
      data: {
        id: updatedReport.id,
        userId: updatedReport.user_id,
        type: updatedReport.type,
        title: updatedReport.title,
        description: updatedReport.description,
        location: {
          lat: updatedReport.latitude,
          lng: updatedReport.longitude
        },
        status: updatedReport.status,
        images: updatedReport.images ? JSON.parse(updatedReport.images) : [],
        createdAt: updatedReport.created_at,
        updatedAt: updatedReport.updated_at
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating report status'
    });
  }
});

// Upload image to report (placeholder - implement file upload as needed)
router.post('/:id/images', async (req, res) => {
  try {
    // This is a placeholder for image upload functionality
    // You would typically use multer for file uploads
    res.json({
      success: true,
      data: { message: 'Image upload endpoint - implement file upload logic' }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Error uploading image'
    });
  }
});

export default router;