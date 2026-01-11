const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    Accept: 'application/json',
  },
};

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    CURRENT_USER: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  REPORTS: {
    CREATE: '/api/reports',
    GET_ALL: '/api/reports',
    GET_BY_ID: (id: string) => `/api/reports/${id}`,
    GET_USER_REPORTS: (userId: string) => `/api/reports/user/${userId}`,
    UPDATE: (id: string) => `/api/reports/${id}`,
    DELETE: (id: string) => `/api/reports/${id}`,
    UPDATE_STATUS: (id: string) => `/api/reports/${id}/status`,
    
    // Unified media upload endpoint - all file types use the same endpoint
    UPLOAD_IMAGE: (id: string) => `/api/reports/${id}/upload`,
    UPLOAD_VIDEO: (id: string) => `/api/reports/${id}/upload`,
    UPLOAD_AUDIO: (id: string) => `/api/reports/${id}/upload`,
    DELETE_MEDIA: (id: string) => `/api/reports/${id}/media`,
    UPLOAD_MEDIA: (id: string) => `/api/reports/${id}/upload`,
  },
  ADMIN: {
    GET_ALL_USERS: '/api/admin/users',
    GET_STATS: '/api/admin/stats',
  },
};