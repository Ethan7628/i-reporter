const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Get the full URL for an image stored on the backend
 */
export const getImageUrl = (imagePath: string): string => {
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If path starts with /, remove it to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${API_BASE_URL}/${cleanPath}`;
};
