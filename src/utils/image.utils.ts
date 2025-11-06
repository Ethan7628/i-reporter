const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Get the full URL for media files stored on the backend
 * Handles images, videos, audio files, and external URLs
 */
export const getMediaUrl = (filePath: string): string => {
  // If already a full URL or data URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  
  // If path starts with /, remove it to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Get the full URL for an image stored on the backend
 * @deprecated Use getMediaUrl instead for better media type support
 */
export const getImageUrl = (imagePath: string): string => {
  return getMediaUrl(imagePath);
};

/**
 * Check if a file path is for a specific media type
 */
export const getMediaType = (filePath: string): 'image' | 'video' | 'audio' | 'unknown' => {
  if (!filePath) return 'unknown';
  
  const extension = filePath.split('.').pop()?.toLowerCase();
  const fullPath = filePath.toLowerCase();
  
  // Image extensions
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  
  // Video extensions
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(extension || '')) {
    return 'video';
  }
  
  // Audio extensions
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension || '')) {
    return 'audio';
  }
  
  // Check by MIME type pattern in data URLs
  if (filePath.startsWith('data:')) {
    if (filePath.includes('image/')) return 'image';
    if (filePath.includes('video/')) return 'video';
    if (filePath.includes('audio/')) return 'audio';
  }
  
  // Check by common path patterns
  if (fullPath.includes('/images/') || fullPath.includes('/img/')) return 'image';
  if (fullPath.includes('/videos/') || fullPath.includes('/video/')) return 'video';
  if (fullPath.includes('/audios/') || fullPath.includes('/audio/')) return 'audio';
  
  return 'unknown';
};

/**
 * Check if a file is an image based on its path or type
 */
export const isImageFile = (filePath: string): boolean => {
  return getMediaType(filePath) === 'image';
};

/**
 * Check if a file is a video based on its path or type
 */
export const isVideoFile = (filePath: string): boolean => {
  return getMediaType(filePath) === 'video';
};

/**
 * Check if a file is an audio file based on its path or type
 */
export const isAudioFile = (filePath: string): boolean => {
  return getMediaType(filePath) === 'audio';
};

export default {
  getMediaUrl,
  getImageUrl,
  getMediaType,
  isImageFile,
  isVideoFile,
  isAudioFile
};