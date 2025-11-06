import { apiService, API_ENDPOINTS } from './api.service';
import { Report, ReportStatus, CreateReportData, UpdateReportData, MediaType, UploadedFile } from '@/types';

class ReportService {
  async create(data: CreateReportData | FormData): Promise<Report> {
    try {
      if (import.meta.env.DEV) {
        console.log('[Report Service] Creating report with:', data);
        console.log('[Report Service] Is FormData?', data instanceof FormData);
        
        // Log FormData contents for debugging
        if (data instanceof FormData) {
          console.log('[Report Service] FormData entries:');
          for (const [key, value] of data.entries()) {
            console.log(key, value instanceof File ? `File: ${value.name} (${value.type})` : value);
          }
        }
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
      if (import.meta.env.DEV) {
        console.log('[Report Service] Updating report:', id, data);
        console.log('[Report Service] Is FormData?', data instanceof FormData);
        
        // Log FormData contents for debugging
        if (data instanceof FormData) {
          console.log('[Report Service] FormData entries:');
          for (const [key, value] of data.entries()) {
            console.log(key, value instanceof File ? `File: ${value.name} (${value.type})` : value);
          }
        }
      }

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

  // SIMPLIFIED: Unified media upload using single endpoint
  async uploadMedia(reportId: string, file: File): Promise<UploadedFile> {
    try {
      // All file types use the same unified upload endpoint
      const endpoint = API_ENDPOINTS.REPORTS.UPLOAD_MEDIA(reportId);

      const response = await apiService.uploadFile<UploadedFile>(
        endpoint,
        file
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload media file');
      }

      return response.data;
    } catch (error) {
      console.error('Upload media error:', error);
      
      if (error instanceof Error && error.message.includes('Network')) {
        throw new Error('Network error. Please check your connection');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload media file');
    }
  }

  // SIMPLIFIED: Upload multiple media files
  async uploadMultipleMedia(reportId: string, files: File[]): Promise<UploadedFile[]> {
    try {
      const uploadPromises = files.map(file => this.uploadMedia(reportId, file));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Upload multiple media error:', error);
      throw new Error('Failed to upload one or more media files');
    }
  }

  // SIMPLIFIED: Upload multiple files to different fields using unified endpoint
  async uploadMediaToFields(reportId: string, files: { file: File; field: string }[]): Promise<UploadedFile[]> {
    try {
      if (import.meta.env.DEV) {
        console.log('[Report Service] Uploading media to fields:', files);
      }

      // Upload multiple files to different fields using unified endpoint
      const response = await apiService.uploadMediaFiles<UploadedFile[]>(
        API_ENDPOINTS.REPORTS.UPLOAD_MEDIA(reportId),
        files
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload media files');
      }

      return response.data;
    } catch (error) {
      console.error('Upload media to fields error:', error);
      throw new Error('Failed to upload media files to specified fields');
    }
  }

  // SIMPLIFIED: Upload with progress tracking using unified endpoint
  async uploadMediaWithProgress(
    reportId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    try {
      // Use unified endpoint for all file types
      const endpoint = API_ENDPOINTS.REPORTS.UPLOAD_MEDIA(reportId);

      const response = await apiService.uploadWithProgress<UploadedFile>(
        endpoint,
        file,
        onProgress
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload media file');
      }

      return response.data;
    } catch (error) {
      console.error('Upload media with progress error:', error);
      throw new Error('Failed to upload media file');
    }
  }

  // Helper method to categorize files by type
  categorizeFiles(files: File[]): { images: File[]; videos: File[]; audios: File[] } {
    const categorized = {
      images: [] as File[],
      videos: [] as File[],
      audios: [] as File[],
    };

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        categorized.images.push(file);
      } else if (file.type.startsWith('video/')) {
        categorized.videos.push(file);
      } else if (file.type.startsWith('audio/')) {
        categorized.audios.push(file);
      }
    });

    return categorized;
  }

  // Bulk upload with automatic field assignment using unified endpoint
  async uploadBulkMedia(reportId: string, files: File[]): Promise<UploadedFile[]> {
    try {
      const categorized = this.categorizeFiles(files);
      const mediaFiles: { file: File; field: string }[] = [];

      // Add images
      categorized.images.forEach(file => {
        mediaFiles.push({ file, field: 'images' });
      });

      // Add videos
      categorized.videos.forEach(file => {
        mediaFiles.push({ file, field: 'videos' });
      });

      // Add audios
      categorized.audios.forEach(file => {
        mediaFiles.push({ file, field: 'audios' });
      });

      if (mediaFiles.length === 0) {
        return [];
      }

      return this.uploadMediaToFields(reportId, mediaFiles);
    } catch (error) {
      console.error('Bulk media upload error:', error);
      throw new Error('Failed to upload bulk media files');
    }
  }

  async deleteMedia(reportId: string, mediaUrl: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        API_ENDPOINTS.REPORTS.DELETE_MEDIA(reportId),
        { data: { mediaUrl } }
      );

      return response.success;
    } catch (error) {
      console.error('Delete media error:', error);
      return false;
    }
  }

  // Helper method to get media type from file or URL
  getMediaType(fileOrUrl: File | string): MediaType {
    if (fileOrUrl instanceof File) {
      if (fileOrUrl.type.startsWith('image/')) return 'image';
      if (fileOrUrl.type.startsWith('video/')) return 'video';
      if (fileOrUrl.type.startsWith('audio/')) return 'audio';
      return 'image'; // default fallback
    } else {
      // URL-based detection
      const url = fileOrUrl.toLowerCase();
      if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return 'image';
      if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/)) return 'video';
      if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) return 'audio';
      return 'image'; // default fallback
    }
  }

  // Method to validate media file before upload
  validateMediaFile(file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
    }

    // Check file type
    const allowedTypes = ['image/', 'video/', 'audio/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      return { valid: false, error: 'File must be an image, video, or audio file' };
    }

    return { valid: true };
  }
}

export const reportService = new ReportService();