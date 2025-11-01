/**
 * Application Constants
 */

import { ReportStatus } from '@/types';

export const APP_NAME = 'iReporter';
export const APP_DESCRIPTION = 'Report corruption and request government interventions';

export const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: 'bg-muted',
  'under-investigation': 'bg-warning',
  rejected: 'bg-destructive',
  resolved: 'bg-secondary',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Draft',
  'under-investigation': 'Under Investigation',
  rejected: 'Rejected',
  resolved: 'Resolved',
};

export const FILE_CONSTRAINTS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGES: 4,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
};

export const VALIDATION_MESSAGES = {
  TITLE_MIN: 'Title must be at least 10 characters',
  TITLE_MAX: 'Title must be less than 200 characters',
  DESCRIPTION_MIN: 'Description must be at least 20 characters',
  DESCRIPTION_MAX: 'Description must be less than 2000 characters',
  IMAGE_TOO_LARGE: 'Images must be less than 5MB',
  TOO_MANY_IMAGES: 'Maximum 4 images allowed',
  CANNOT_EDIT: 'Cannot edit reports that are under investigation, rejected, or resolved',
  CANNOT_DELETE: 'Cannot delete reports that are under investigation, rejected, or resolved',
};
