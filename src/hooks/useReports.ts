/**
 * Reports Hook
 * 
 * Provides report management functionality to components
 */

import { useState, useEffect } from 'react';
import { reportService } from '@/services/report.service';
import { Report, ReportStatus, CreateReportData, UpdateReportData } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useReports = (userId?: string, fetchAll = false) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = fetchAll 
        ? await reportService.getAll()
        : userId 
          ? await reportService.getUserReports(userId)
          : [];
      setReports(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch reports';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId || fetchAll) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [userId, fetchAll]);

  const createReport = async (data: CreateReportData, userId: string) => {
    try {
      const newReport = await reportService.create(data, userId);
      setReports((prev) => [newReport, ...prev]);
      toast({
        title: 'Report created!',
        description: 'Your report has been submitted successfully.',
      });
      return newReport;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateReport = async (id: string, data: UpdateReportData) => {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteReport = async (id: string, userId: string) => {
    try {
      const success = await reportService.delete(id, userId);
      if (success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        toast({
          title: 'Report deleted',
          description: 'Your report has been removed',
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete report';
      toast({
        title: 'Cannot delete',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateStatus = async (id: string, status: ReportStatus) => {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getReport = async (id: string) => {
    try {
      return await reportService.getById(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    updateStatus,
    getReport,
    refetch: fetchReports,
  };
};
