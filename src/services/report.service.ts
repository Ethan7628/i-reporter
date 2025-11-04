import { apiService, API_ENDPOINTS } from './api.service';
import { Report, ReportStatus, CreateReportData, UpdateReportData } from '@/types';

class ReportService {
  async create(data: CreateReportData | FormData): Promise<Report> {
    try {
      if (import.meta.env.DEV) {
        console.log('[Report Service] Creating report with:', data);
        console.log('[Report Service] Is FormData?', data instanceof FormData);
      }

      const response = await apiService.post<Report>(
        API_ENDPOINTS.REPORTS.CREATE,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create report');
      }

      return response.data;
    } catch (error) {
      console.error('Create report error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create report');
    }
  }

  async getAll(): Promise<Report[]> {
    try {
      const response = await apiService.get<Report[]>(
        API_ENDPOINTS.REPORTS.GET_ALL
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch reports');
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Get all reports error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch reports');
    }
  }

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

  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const response = await apiService.get<Report[]>(
        API_ENDPOINTS.REPORTS.GET_USER_REPORTS(userId)
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user reports');
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Get user reports error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user reports');
    }
  }

  async update(id: string, data: UpdateReportData | FormData): Promise<Report | null> {
    try {
      const response = await apiService.put<Report>(
        API_ENDPOINTS.REPORTS.UPDATE(id),
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update report');
      }

      return response.data;
    } catch (error) {
      console.error('Update report error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update report');
    }
  }

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

  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    try {
      const response = await apiService.patch<Report>(
        API_ENDPOINTS.REPORTS.UPDATE_STATUS(id),
        { status }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update status');
      }

      return response.data;
    } catch (error) {
      console.error('Update status error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update status');
    }
  }

  async uploadImage(reportId: string, file: File): Promise<string> {
    try {
      const response = await apiService.uploadFile<{ url: string }>(
        API_ENDPOINTS.REPORTS.UPLOAD_IMAGE(reportId),
        file
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload image');
      }

      return response.data.url;
    } catch (error) {
      console.error('Upload image error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image');
    }
  }
}

export const reportService = new ReportService();