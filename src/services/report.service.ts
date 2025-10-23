/**
 * Report Service
 * 
 * Handles all report-related operations.
 * Currently uses mock data - will switch to real API when backend is ready.
 */

import { apiService, API_ENDPOINTS } from './api.service';
import { 
  Report, 
  ReportStatus, 
  CreateReportData, 
  UpdateReportData,
  reportSchema 
} from '@/types';

const REPORTS_KEY = 'ireporter_reports';

class ReportService {
  /**
   * Create a new report
   */
  async create(data: CreateReportData, userId: string): Promise<Report> {
    // Validate input
    const validated = reportSchema.parse(data);

    // TODO: Replace with real API call when ready
    // const response = await apiService.post<Report>(
    //   API_ENDPOINTS.REPORTS.CREATE,
    //   { ...validated, userId }
    // );
    // if (!response.success || !response.data) {
    //   throw new Error(response.error || 'Failed to create report');
    // }
    // return response.data;

    // Mock implementation
    return this.mockCreate(validated, userId);
  }

  /**
   * Get all reports
   */
  async getAll(): Promise<Report[]> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.get<Report[]>(API_ENDPOINTS.REPORTS.GET_ALL);
    // if (!response.success || !response.data) {
    //   throw new Error(response.error || 'Failed to fetch reports');
    // }
    // return response.data;

    // Mock implementation
    return this.mockGetAll();
  }

  /**
   * Get a single report by ID
   */
  async getById(id: string): Promise<Report | null> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.get<Report>(API_ENDPOINTS.REPORTS.GET_BY_ID(id));
    // if (!response.success) {
    //   return null;
    // }
    // return response.data || null;

    // Mock implementation
    return this.mockGetById(id);
  }

  /**
   * Get all reports for a specific user
   */
  async getUserReports(userId: string): Promise<Report[]> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.get<Report[]>(
    //   API_ENDPOINTS.REPORTS.GET_USER_REPORTS(userId)
    // );
    // if (!response.success || !response.data) {
    //   throw new Error(response.error || 'Failed to fetch user reports');
    // }
    // return response.data;

    // Mock implementation
    return this.mockGetAll().filter(r => r.userId === userId);
  }

  /**
   * Update a report
   */
  async update(id: string, data: UpdateReportData): Promise<Report | null> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.patch<Report>(
    //   API_ENDPOINTS.REPORTS.UPDATE(id),
    //   data
    // );
    // if (!response.success) {
    //   throw new Error(response.error || 'Failed to update report');
    // }
    // return response.data || null;

    // Mock implementation
    return this.mockUpdate(id, data);
  }

  /**
   * Delete a report
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.delete(API_ENDPOINTS.REPORTS.DELETE(id));
    // if (!response.success) {
    //   throw new Error(response.error || 'Failed to delete report');
    // }
    // return true;

    // Mock implementation
    return this.mockDelete(id, userId);
  }

  /**
   * Update report status (admin only)
   */
  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.patch<Report>(
    //   API_ENDPOINTS.REPORTS.UPDATE_STATUS(id),
    //   { status }
    // );
    // if (!response.success) {
    //   throw new Error(response.error || 'Failed to update status');
    // }
    // return response.data || null;

    // Mock implementation
    return this.mockUpdateStatus(id, status);
  }

  /**
   * Upload image for a report
   */
  async uploadImage(reportId: string, file: File): Promise<string> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.uploadFile<{ url: string }>(
    //   API_ENDPOINTS.REPORTS.UPLOAD_IMAGE(reportId),
    //   file
    // );
    // if (!response.success || !response.data) {
    //   throw new Error(response.error || 'Failed to upload image');
    // }
    // return response.data.url;

    // Mock implementation - convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============= MOCK IMPLEMENTATIONS (Remove when backend is ready) =============

  private mockCreate(data: CreateReportData, userId: string): Report {
    const reports = this.mockGetAll();
    
    const newReport: Report = {
      id: crypto.randomUUID(),
      userId,
      type: data.type,
      title: data.title,
      description: data.description,
      location: null,
      status: 'draft',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reports.push(newReport);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return newReport;
  }

  private mockGetAll(): Report[] {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  }

  private mockGetById(id: string): Report | null {
    const reports = this.mockGetAll();
    return reports.find(r => r.id === id) || null;
  }

  private mockUpdate(id: string, data: UpdateReportData): Report | null {
    const reports = this.mockGetAll();
    const index = reports.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    const report = reports[index];
    
    // Check if editable
    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      if (data.status === undefined) {
        throw new Error('Cannot edit reports that are under investigation, rejected, or resolved');
      }
    }

    reports[index] = {
      ...report,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return reports[index];
  }

  private mockDelete(id: string, userId: string): boolean {
    const reports = this.mockGetAll();
    const report = reports.find(r => r.id === id);
    
    if (!report || report.userId !== userId) return false;
    
    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      throw new Error('Cannot delete reports that are under investigation, rejected, or resolved');
    }

    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
    return true;
  }

  private mockUpdateStatus(id: string, status: ReportStatus): Report | null {
    const reports = this.mockGetAll();
    const index = reports.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return reports[index];
  }
}

export const reportService = new ReportService();
