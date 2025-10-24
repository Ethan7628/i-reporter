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

const REPORTS_CACHE_KEY = 'ireporter_reports_cache';

function readCache(): Report[] {
  try {
    const raw = localStorage.getItem(REPORTS_CACHE_KEY) || '[]';
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

function writeCache(reports: Report[]) {
  try { localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(reports)); } catch {}
}

export const mockReports = {
  // async implementations that call backend
  createAsync: async (data: z.infer<typeof reportSchema>, userId: string): Promise<Report> => {
    const res = await api.post<{ report: Report }>('/reports', data as any);
    const reports = readCache();
    reports.push(res.report);
    writeCache(reports);
    return res.report;
  },

  getAllAsync: async (): Promise<Report[]> => {
    const res = await api.get<{ reports: Report[] }>('/reports');
    writeCache(res.reports);
    return res.reports;
  },

  getByIdAsync: async (id: string): Promise<Report | null> => {
    const res = await api.get<{ report: Report }>(`/reports/${id}`);
    return res.report || null;
  },

  getUserReportsAsync: async (userId: string): Promise<Report[]> => {
    const res = await api.get<{ reports: Report[] }>(`/reports?userId=${encodeURIComponent(userId)}`);
    // update cache partially
    writeCache(res.reports);
    return res.reports;
  },

  updateAsync: async (id: string, data: Partial<Report>): Promise<Report | null> => {
    const res = await api.put<{ report: Report }>(`/reports/${id}`, data as any);
    const reports = readCache();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1 && res.report) {
      reports[idx] = res.report;
      writeCache(reports);
    }
    return res.report || null;
  },

  deleteAsync: async (id: string, userId: string): Promise<boolean> => {
    await api.del(`/reports/${id}`);
    const reports = readCache().filter(r => r.id !== id);
    writeCache(reports);
    return true;
  },

  updateStatusAsync: async (id: string, status: ReportStatus): Promise<Report | null> => {
    const res = await api.post<{ report: Report }>(`/reports/${id}/status`, { status } as any);
    const reports = readCache();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1 && res.report) {
      reports[idx] = res.report;
      writeCache(reports);
    }
    return res.report || null;
  },

  // synchronous compatibility layer used by existing components
  create: (data: z.infer<typeof reportSchema>, userId: string): Report => {
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
    const reports = readCache();
    reports.push(newReport);
    writeCache(reports);
    return newReport;
  },

  getAll: (): Report[] => {
    return readCache();
  },

  getById: (id: string): Report | null => {
    return readCache().find(r => r.id === id) || null;
  },

  getUserReports: (userId: string): Report[] => {
    return readCache().filter(r => r.userId === userId);
  },

  update: (id: string, data: Partial<Report>): Report | null => {
    const reports = readCache();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return null;
    const report = reports[index];
    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      if (data.status === undefined) {
        throw new Error('Cannot edit reports that are under investigation, rejected, or resolved');
      }
    }
    reports[index] = { ...report, ...data, updatedAt: new Date().toISOString() };
    writeCache(reports);
    return reports[index];
  },

  delete: (id: string, userId: string): boolean => {
    const reports = readCache();
    const report = reports.find(r => r.id === id);
    if (!report || report.userId !== userId) return false;
    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      throw new Error('Cannot delete reports that are under investigation, rejected, or resolved');
    }
    const filtered = reports.filter(r => r.id !== id);
    writeCache(filtered);
    return true;
  },

  updateStatus: (id: string, status: ReportStatus): Report | null => {
    const reports = readCache();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return null;
    reports[index] = { ...reports[index], status, updatedAt: new Date().toISOString() };
    writeCache(reports);
    return reports[index];
  },
};
