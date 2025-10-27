export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    CURRENT_USER: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh',
  },
  // Reports
  REPORTS: {
    CREATE: '/reports',
    GET_ALL: '/reports',
    GET_BY_ID: (id: string) => `/reports/${id}`,
    GET_USER_REPORTS: (userId: string) => `/reports/user/${userId}`,
    UPDATE: (id: string) => `/reports/${id}`,
    DELETE: (id: string) => `/reports/${id}`,
    UPDATE_STATUS: (id: string) => `/reports/${id}/status`,
    UPLOAD_IMAGE: (id: string) => `/reports/${id}/images`,
  },
};
