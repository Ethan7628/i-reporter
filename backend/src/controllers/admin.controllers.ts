/**
 * Admin Controllers
 * 
 * Handles admin-specific operations:
 * - Get all users with report counts
 * - Get user statistics
 */

import { Request, Response } from 'express';
import { query } from '../utils/database';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user: TokenPayload;
}

interface UserWithReportCount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  totalReports: number;
  redFlagReports: number;
  interventionReports: number;
}

interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalReports: number;
  reportsByStatus: {
    draft: number;
    underInvestigation: number;
    rejected: number;
    resolved: number;
  };
}

/**
 * Get all users with their report counts
 * 
 * @route GET /api/admin/users
 * @returns List of all users with report statistics
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all users with their report counts using a LEFT JOIN
    const result = await query(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        COUNT(r.id) as total_reports,
        SUM(CASE WHEN r.type = 'red-flag' THEN 1 ELSE 0 END) as red_flag_reports,
        SUM(CASE WHEN r.type = 'intervention' THEN 1 ELSE 0 END) as intervention_reports
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
      ORDER BY u.created_at DESC`
    );

    // Format the response
    const users: UserWithReportCount[] = result.rows.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
      totalReports: parseInt(user.total_reports) || 0,
      redFlagReports: parseInt(user.red_flag_reports) || 0,
      interventionReports: parseInt(user.intervention_reports) || 0,
    }));

    res.json({
      success: true,
      data: users,
    });

    console.log(`✅ Admin fetched all users: ${users.length} users found`);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * Get overall statistics for admin dashboard
 * 
 * @route GET /api/admin/stats
 * @returns Overall user and report statistics
 */
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user counts
    const userCountResult = await query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users`
    );

    // Get report counts by status
    const reportCountResult = await query(
      `SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'under-investigation' THEN 1 ELSE 0 END) as under_investigation_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM reports`
    );

    const userStats = userCountResult.rows[0];
    const reportStats = reportCountResult.rows[0];

    const stats: UserStats = {
      totalUsers: parseInt(userStats.total_users) || 0,
      totalAdmins: parseInt(userStats.total_admins) || 0,
      totalReports: parseInt(reportStats.total_reports) || 0,
      reportsByStatus: {
        draft: parseInt(reportStats.draft_count) || 0,
        underInvestigation: parseInt(reportStats.under_investigation_count) || 0,
        rejected: parseInt(reportStats.rejected_count) || 0,
        resolved: parseInt(reportStats.resolved_count) || 0,
      },
    };

    res.json({
      success: true,
      data: stats,
    });

    console.log('✅ Admin fetched user stats');
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};
