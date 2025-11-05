const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Get the full URL for an image stored on the backend
 */
export const getImageUrl = (imagePath: string): string => {
  return imagePath;
};