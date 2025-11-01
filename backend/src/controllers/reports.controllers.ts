import { Request, Response } from 'express';
import { query } from '../utils/database.js';

export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, type, location } = req.body;

    // Validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and type are required'
      });
    }

    // Validate type
    if (!['red-flag', 'intervention'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "red-flag" or "intervention"'
      });
    }

    const result = await query(
      `INSERT INTO reports (user_id, title, description, type, location, images) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, title, description, type, location || null, []]
    );

    const report = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: report.id,
        userId: report.user_id,
        type: report.type,
        title: report.title,
        description: report.description,
        location: report.location,
        status: report.status,
        images: report.images,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating report'
    });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC`
    );

    const reports = result.rows.map(report => ({
      id: report.id,
      userId: report.user_id,
      type: report.type,
      title: report.title,
      description: report.description,
      location: report.location,
      status: report.status,
      images: report.images,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      user: {
        firstName: report.first_name,
        lastName: report.last_name,
        email: report.email
      }
    }));

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching reports'
    });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = result.rows[0];

    res.json({
      success: true,
      data: {
        id: report.id,
        userId: report.user_id,
        type: report.type,
        title: report.title,
        description: report.description,
        location: report.location,
        status: report.status,
        images: report.images,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        user: {
          firstName: report.first_name,
          lastName: report.last_name,
          email: report.email
        }
      }
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching report'
    });
  }
};

export const getUserReports = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user.userId;
    const currentUserRole = (req as any).user.role;

    // Users can only access their own reports unless they're admin
    if (currentUserRole !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await query(
      `SELECT * FROM reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const reports = result.rows.map(report => ({
      id: report.id,
      userId: report.user_id,
      type: report.type,
      title: report.title,
      description: report.description,
      location: report.location,
      status: report.status,
      images: report.images,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching user reports'
    });
  }
};

export const updateReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { title, description, location, images } = req.body;

    // Check if report exists and user has permission
    const existingReport = await query(
      'SELECT * FROM reports WHERE id = $1',
      [id]
    );

    if (existingReport.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = existingReport.rows[0];

    // Only owner or admin can update
    if (report.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Cannot edit reports that are not in draft status (unless admin)
    if (report.status !== 'draft' && userRole !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit report in current status'
      });
    }

    const result = await query(
      `UPDATE reports 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           images = COALESCE($4, images),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, location, images, id]
    );

    const updatedReport = result.rows[0];

    res.json({
      success: true,
      data: {
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
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating report'
    });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check if report exists and user has permission
    const existingReport = await query(
      'SELECT * FROM reports WHERE id = $1',
      [id]
    );

    if (existingReport.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = existingReport.rows[0];

    // Only owner or admin can delete
    if (report.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await query('DELETE FROM reports WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting report'
    });
  }
};

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = (req as any).user.role;

    // Only admin can update status
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Validate status
    if (!['draft', 'under-investigation', 'rejected', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const result = await query(
      `UPDATE reports 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
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
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating report status'
    });
  }
};