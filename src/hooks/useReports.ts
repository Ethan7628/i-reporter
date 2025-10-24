/**
 * Reports Hook
 * 
 * Provides report management functionality with comprehensive error handling
 */

import { useState, useCallback } from 'react';
import { reportService } from '@/services/report.service';
import { Report, ReportStatus, CreateReportData, UpdateReportData } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    console.error(defaultMessage, err);
    return message;
  }, []);

  const getAllReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getAll();
      setReports(data);
    } catch (err) {
      const message = handleError(err, 'Failed to fetch reports');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const getUserReports = useCallback(async (userId: string) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getUserReports(userId);
      setReports(data);
    } catch (err) {
      const message = handleError(err, 'Failed to fetch user reports');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const createReport = useCallback(async (data: CreateReportData): Promise<Report | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!data.title || !data.description || !data.type) {
        throw new Error('Title, description, and type are required');
      }

      const newReport = await reportService.create(data);
      setReports((prev) => [newReport, ...prev]);
      
      toast({
        title: 'Report created!',
        description: 'Your report has been submitted successfully.',
      });
      
      return newReport;
    } catch (err) {
      const message = handleError(err, 'Failed to create report');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const updateReport = useCallback(async (id: string, data: UpdateReportData): Promise<Report | null> => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Report ID is required',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await reportService.update(id, data);
      
      if (updated) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? updated : r))
        );
        toast({
          title: 'Report updated!',
          description: 'Your changes have been saved.',
        });
        return updated;
      }
      return null;
    } catch (err) {
      const message = handleError(err, 'Failed to update report');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Report ID is required',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      const success = await reportService.delete(id);
      
      if (success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      const message = handleError(err, 'Failed to delete report');
      toast({
        title: 'Cannot delete',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const updateStatus = useCallback(async (id: string, status: ReportStatus): Promise<Report | null> => {
    if (!id || !status) {
      toast({
        title: 'Error',
        description: 'Report ID and status are required',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await reportService.updateStatus(id, status);
      
      if (updated) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? updated : r))
        );
        toast({
          title: 'Status updated',
          description: `Report status changed to ${status}`,
        });
        return updated;
      }
      return null;
    } catch (err) {
      const message = handleError(err, 'Failed to update status');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const getReport = useCallback(async (id: string): Promise<Report | null> => {
    if (!id) {
      setError('Report ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      return await reportService.getById(id);
    } catch (err) {
      const message = handleError(err, 'Failed to fetch report');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, handleError]);

  const updateReportStatus = useCallback(async (id: string, status: ReportStatus): Promise<Report | null> => {
    return await updateStatus(id, status);
  }, [updateStatus]);

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    updateStatus,
    updateReportStatus,
    getReport,
    getAllReports,
    getUserReports,
  };
};
