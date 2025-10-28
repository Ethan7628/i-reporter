import { apiService, API_ENDPOINTS } from './api.service';
import { Report, ReportStatus, CreateReportData, UpdateReportData, reportSchema } from '@/types';

class ReportService {
  async create(data: CreateReportData): Promise<Report> {
    try {
      // Validate input
      const validated = reportSchema.parse({
        title: data.title,
        description: data.description,
        type: data.type,
      });

      const response = await apiService.post<Report>(
        API_ENDPOINTS.REPORTS.CREATE,
        {
          ...validated,
          location: data.location || null,
          images: data.images || [],
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create report. Please try again.');
      }

      return response.data;
    } catch (error) {
      console.error('Create report error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create report. Please try again.');
    }
  }

  /**
   * Get all reports
   */
  async getAll(): Promise<Report[]> {
    try {
      const response = await apiService.get<{ reports: Report[] }>(
        API_ENDPOINTS.REPORTS.GET_ALL
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch reports. Please try again.');
      }

      return response.data.reports || [];
    } catch (error) {
      console.error('Get all reports error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch reports. Please try again.');
    }
  }

  /**
   * Get a single report by ID
   */
  async getById(id: string): Promise<Report | null> {
    try {
      const response = await apiService.get<Report>(
        API_ENDPOINTS.REPORTS.GET_BY_ID(id)
      );

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Get report error:', error);
      return null;
    }
  }

  /**
   * Get reports for a specific user
   */
  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const response = await apiService.get<{ reports: Report[] }>(
        API_ENDPOINTS.REPORTS.GET_USER_REPORTS(userId)
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user reports. Please try again.');
      }

      return response.data.reports || [];
    } catch (error) {
      console.error('Get user reports error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user reports. Please try again.');
    }
  }

  /**
   * Update a report
   */
  async update(id: string, data: UpdateReportData): Promise<Report | null> {
    try {
      const response = await apiService.put<Report>(
        API_ENDPOINTS.REPORTS.UPDATE(id),
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update report. Please try again.');
      }

      return response.data;
    } catch (error) {
      console.error('Update report error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update report. Please try again.');
    }
  }

  /**
   * Delete a report
   */
  async delete(id: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        API_ENDPOINTS.REPORTS.DELETE(id)
      );

      return response.success;
    } catch (error) {
      console.error('Delete report error:', error);
      return false;
    }
  }

  /**
   * Update report status (admin only)
   */
  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    try {
      const response = await apiService.patch<Report>(
        API_ENDPOINTS.REPORTS.UPDATE_STATUS(id),
        { status }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update status. Please try again.');
      }

      return response.data;
    } catch (error) {
      console.error('Update status error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update status. Please try again.');
    }
  }

  /**
   * Upload an image for a report
   */
  async uploadImage(reportId: string, file: File): Promise<string> {
    try {
      const response = await apiService.uploadFile<{ url: string }>(
        API_ENDPOINTS.REPORTS.UPLOAD_IMAGE(reportId),
        file
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload image. Please try again.');
      }

      return response.data.url;
    } catch (error) {
      console.error('Upload image error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image. Please try again.');
    }
  }
}

export const reportService = new ReportService();