import { z } from 'zod';

// ============= User Types =============
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type SignupCredentials = z.infer<typeof signupSchema>;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// ============= Report Types =============
export type ReportType = 'red-flag' | 'intervention';
export type ReportStatus = 'draft' | 'under-investigation' | 'rejected' | 'resolved';

export interface ReportLocation {
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  title: string;
  description: string;
  location: ReportLocation | null;
  status: ReportStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export const reportSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['red-flag', 'intervention']),
});

export interface CreateReportData {
  title: string;
  description: string;
  type: ReportType;
  location?: ReportLocation | null;
  images?: string[];
}

export interface UpdateReportData extends Partial<CreateReportData> {
  status?: ReportStatus;
}

// ============= API Response Types =============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
