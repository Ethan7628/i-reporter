import { Request, Response } from 'express';
import { query } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Report {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  location: string | null;
  images: string;
  status: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ReportResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  location: string | null;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: string;
  role: string;
}

interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sql?: string;
  sqlState?: string;
  sqlMessage?: string;
}

interface CreateReportBody {
  title: string;
  description: string;
  type: string;
  location?: any;
}

interface UpdateReportBody {
  title?: string;
  description?: string;
  location?: any;
  images?: string[];
}

interface UpdateStatusBody {
  status: string;
}

interface AuthRequest extends Request {
  user: User;
}

// Constants
const VALID_REPORT_TYPES: string[] = ['red-flag', 'intervention'];
const VALID_STATUS_VALUES: string[] = ['draft', 'under-investigation', 'rejected', 'resolved'];

// Utility functions
const parseImages = (images: any): string[] => {
  try {
    return Array.isArray(images) ? images : JSON.parse(images || '[]');
  } catch (error) {
    console.error('Error parsing images:', error);
    return [];
  }
};

const buildReportResponse = (report: Report): ReportResponse => ({
  id: report.id,
  userId: report.user_id,
  type: report.type,
  title: report.title,
  description: report.description,
  location: report.location,
  status: report.status,
  images: parseImages(report.images),
  createdAt: report.created_at,
  updatedAt: report.updated_at
});

const handleDatabaseError = (error: unknown, res: Response): Response => {
  console.error('Database error:', error);

  const dbError = error as DatabaseError;

  if (dbError?.code === 'ER_DATA_TOO_LONG') {
    return res.status(400).json({
      success: false,
      error: 'One of the fields is too long. Please shorten your description and try again.'
    });
  }

  if (dbError?.code === 'ER_BAD_NULL_ERROR') {
    return res.status(400).json({
      success: false,
      error: 'A required field was missing. Please ensure all fields are filled.'
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

// Middleware functions
const validateReportOwnership = (report: Report, userId: string, userRole: string): boolean => {
  return userRole === 'admin' || report.user_id === userId;
};

const canEditReport = (report: Report): boolean => {
  return report.status === 'draft';
};

// Controller functions
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;
    const body: CreateReportBody = req.body;
    const { title, description, type, location } = body;
    const reportId: string = uuidv4();

    // Validate required fields
    if (!title || !description || !type) {
      res.status(400).json({
        success: false,
        error: 'Title, description, and type are required'
      });
      return;
    }

    // Validate type
    if (!VALID_REPORT_TYPES.includes(type)) {
      res.status(400).json({
        success: false,
        error: `Type must be one of: ${VALID_REPORT_TYPES.join(', ')}`
      });
      return;
    }

    const locationValue: string = location ? JSON.stringify(location) : 'null';

    // Insert the report with generated UUID
    await query(
      `INSERT INTO reports (id, user_id, title, description, type, location, images, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reportId, userId, title, description, type, locationValue, JSON.stringify([]), 'draft']
    );

    // Get the created report
    const reportResult = await query(
      `SELECT * FROM reports WHERE id = ?`,
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve created report'
      });
      return;
    }

    const report: Report = reportResult.rows[0] as Report;

    res.status(201).json({
      success: true,
      data: buildReportResponse(report)
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const getAllReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user: User = authReq.user;
    
    let result;
    if (user.role === 'admin') {
      result = await query(
        `SELECT r.*, u.first_name, u.last_name, u.email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         ORDER BY r.created_at DESC`
      );
    } else {
      result = await query(
        `SELECT r.*, u.first_name, u.last_name, u.email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [user.userId]
      );
    }

    const reports: any[] = result.rows.map((report: Report) => ({
      ...buildReportResponse(report),
      user: {
        firstName: report.first_name,
        lastName: report.last_name,
        email: report.email
      }
    }));

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const user: User = authReq.user;

    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const report: Report = result.rows[0] as Report;

    if (!validateReportOwnership(report, user.userId, user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...buildReportResponse(report),
        user: {
          firstName: report.first_name,
          lastName: report.last_name,
          email: report.email
        }
      }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const getUserReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const authReq = req as AuthRequest;
    const currentUserId: string = authReq.user.userId;
    const currentUserRole: string = authReq.user.role;

    if (currentUserRole !== 'admin' && currentUserId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const result = await query(
      `SELECT * FROM reports 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const reports: ReportResponse[] = result.rows.map((report: Report) => buildReportResponse(report));

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;
    const body: UpdateReportBody = req.body;
    const { title, description, location, images } = body;

    const existingReport = await query(
      'SELECT * FROM reports WHERE id = ?',
      [id]
    );

    if (existingReport.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const report: Report = existingReport.rows[0] as Report;

    if (report.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    if (!canEditReport(report)) {
      res.status(400).json({
        success: false,
        error: 'Cannot edit report in current status'
      });
      return;
    }

    await query(
      `UPDATE reports 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           location = COALESCE(?, location),
           images = COALESCE(?, images),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, location, images ? JSON.stringify(images) : null, id]
    );

    const updatedResult = await query('SELECT * FROM reports WHERE id = ?', [id]);
    const updatedReport: Report = updatedResult.rows[0] as Report;

    res.json({
      success: true,
      data: buildReportResponse(updatedReport)
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;

    const existingReport = await query(
      'SELECT * FROM reports WHERE id = ?',
      [id]
    );

    if (existingReport.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const report: Report = existingReport.rows[0] as Report;

    if (report.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    if (!canEditReport(report)) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete report in current status'
      });
      return;
    }

    await query('DELETE FROM reports WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

export const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body: UpdateStatusBody = req.body;
    const { status } = body;
    const authReq = req as AuthRequest;
    const userRole: string = authReq.user.role;

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    if (!VALID_STATUS_VALUES.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status value. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`
      });
      return;
    }

    await query(
      `UPDATE reports 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, id]
    );

    const result = await query('SELECT * FROM reports WHERE id = ?', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    const updatedReport: Report = result.rows[0] as Report;

    res.json({
      success: true,
      data: buildReportResponse(updatedReport)
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};