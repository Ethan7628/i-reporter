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
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      return JSON.parse(images || '[]');
    }
    return [];
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

// Get image paths from uploaded files
const getImagePaths = (files: Express.Multer.File[]): string[] => {
  return files.map(file => `/uploads/${file.filename}`);
};

// Debug function to log upload details
const debugFileUpload = (req: Request): void => {
  console.log('=== FILE UPLOAD DEBUG ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers['content-type']);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Files received:', req.files);
  
  if (req.files && Array.isArray(req.files)) {
    console.log('Number of files:', req.files.length);
    (req.files as Express.Multer.File[]).forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      });
    });
  } else {
    console.log('No files found in req.files');
  }
  console.log('=== END DEBUG ===');
};

// Controller functions
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId: string = authReq.user.userId;
    const body: CreateReportBody = req.body;
    const { title, description, type, location } = body;
    const reportId: string = uuidv4();

    // Debug file upload
    debugFileUpload(req);

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
    
    // Handle uploaded images
    let imagePaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      imagePaths = getImagePaths(req.files as Express.Multer.File[]);
      console.log('Image paths to save to DB:', imagePaths);
    } else {
      console.log('No images found in request');
    }

    // Insert the report with generated UUID and image paths
    const insertQuery = `INSERT INTO reports (id, user_id, title, description, type, location, images, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertParams = [reportId, userId, title, description, type, locationValue, JSON.stringify(imagePaths), 'draft'];
    
    console.log('Executing query:', insertQuery);
    console.log('With parameters:', insertParams);

    await query(insertQuery, insertParams);

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
    console.log('Final report from DB - images field:', report.images);

    res.status(201).json({
      success: true,
      data: buildReportResponse(report)
    });
  } catch (error) {
    console.error('Create report error:', error);
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

    // Debug file upload for updates
    debugFileUpload(req);

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

    // Handle form data - check both body and file uploads
    let title = report.title;
    let description = report.description;
    let location = report.location;
    
    // Parse existing images from DB (it's stored as JSON string)
    let existingImages: string[] = parseImages(report.images);

    // If we have form data (multipart), get fields from body
    if (req.body.title !== undefined) title = req.body.title;
    if (req.body.description !== undefined) description = req.body.description;
    if (req.body.location !== undefined) {
      try {
        location = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
      } catch (e) {
        console.error('Error parsing location:', e);
        location = report.location;
      }
    }

    // Handle new uploaded images - append to existing images
    if (req.files && Array.isArray(req.files) && (req.files as Express.Multer.File[]).length > 0) {
      const newImagePaths = getImagePaths(req.files as Express.Multer.File[]);
      existingImages = [...existingImages, ...newImagePaths];
      console.log('Added new images. Total images:', existingImages);
    }

    // Prepare values for database
    const locationValue = location && location !== 'null' ? JSON.stringify(location) : null;
    const imagesValue = JSON.stringify(existingImages);

    console.log('Final values for DB update:', {
      title,
      description,
      location: locationValue,
      images: imagesValue
    });

    await query(
      `UPDATE reports 
       SET title = ?,
           description = ?,
           location = ?,
           images = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, locationValue, imagesValue, id]
    );

    const updatedResult = await query('SELECT * FROM reports WHERE id = ?', [id]);
    const updatedReport: Report = updatedResult.rows[0] as Report;

    res.json({
      success: true,
      data: buildReportResponse(updatedReport)
    });
  } catch (error) {
    console.error('Update report error:', error);
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