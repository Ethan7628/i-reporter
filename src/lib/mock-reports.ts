import { z } from 'zod';
<<<<<<< HEAD
=======
import api from './api';
>>>>>>> ivan

export type ReportType = 'red-flag' | 'intervention';
export type ReportStatus = 'draft' | 'under-investigation' | 'rejected' | 'resolved';

export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  status: ReportStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export const reportSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['red-flag', 'intervention']),
});

<<<<<<< HEAD
const REPORTS_KEY = 'ireporter_reports';

export const mockReports = {
  create: (data: z.infer<typeof reportSchema>, userId: string): Report => {
    const reports = mockReports.getAll();
    
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
  },

  getAll: (): Report[] => {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  },

  getById: (id: string): Report | null => {
    const reports = mockReports.getAll();
    return reports.find(r => r.id === id) || null;
  },

  getUserReports: (userId: string): Report[] => {
    return mockReports.getAll().filter(r => r.userId === userId);
  },

  update: (id: string, data: Partial<Report>): Report | null => {
    const reports = mockReports.getAll();
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
  },

  delete: (id: string, userId: string): boolean => {
    const reports = mockReports.getAll();
    const report = reports.find(r => r.id === id);
    
    if (!report || report.userId !== userId) return false;
    
    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      throw new Error('Cannot delete reports that are under investigation, rejected, or resolved');
    }

    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
    return true;
  },

  updateStatus: (id: string, status: ReportStatus): Report | null => {
    const reports = mockReports.getAll();
    const index = reports.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return reports[index];
=======
export const mockReports = {
  create: async (data: z.infer<typeof reportSchema>, userId: string): Promise<Report> => {
    const res = await api.post<{ report: Report }>('/reports', data as any);
    return res.report;
  },

  getAll: async (): Promise<Report[]> => {
    const res = await api.get<{ reports: Report[] }>('/reports');
    return res.reports;
  },

  getById: async (id: string): Promise<Report | null> => {
    const res = await api.get<{ report: Report }>(`/reports/${id}`);
    return res.report || null;
  },

  getUserReports: async (userId: string): Promise<Report[]> => {
    const res = await api.get<{ reports: Report[] }>(`/reports?userId=${encodeURIComponent(userId)}`);
    return res.reports;
  },

  update: async (id: string, data: Partial<Report>): Promise<Report | null> => {
    const res = await api.put<{ report: Report }>(`/reports/${id}`, data as any);
    return res.report || null;
  },

  delete: async (id: string, userId: string): Promise<boolean> => {
    // backend should enforce ownership; we pass userId optionally
    await api.del(`/reports/${id}`);
    return true;
  },

  updateStatus: async (id: string, status: ReportStatus): Promise<Report | null> => {
    const res = await api.post<{ report: Report }>(`/reports/${id}/status`, { status } as any);
    return res.report || null;
>>>>>>> ivan
  },
};
