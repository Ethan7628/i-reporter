import { z } from 'zod';
import api from './api';


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

  },
};
