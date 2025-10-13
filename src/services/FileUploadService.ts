const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface UploadResponse {
  url: string;
  fileName?: string;
  fileSize?: number;
  cloudName?: string;
  publicId?: string;
}

export class FileUploadService {
  /**
   * Upload image file to Cloudinary via backend
   * @param file - Image file to upload
   * @param _folder - Cloudinary folder (handled by backend automatically)
   * @returns Promise<UploadResponse>
   */
  static async uploadImage(file: File, _folder = 'Audio'): Promise<UploadResponse> {
    try {
      // For seller pages, token is stored as 'seller_token'
      // For customer pages, token is stored as 'accessToken'
      let token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Access token not found. Please login again.');
      }

      // Validate file trước khi upload
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Try different API endpoints - add /api prefix
      const endpoints = [
        `${API_BASE_URL}/api/v1/uploads/images`,   // Primary endpoint
        `${API_BASE_URL}/api/uploads/images`,      // Fallback
      ];

      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          // Tạo FormData để upload file
          // Backend expects field name 'files' (plural), not 'file'
          const formData = new FormData();
          formData.append('files', file);
          // Note: folder parameter is handled by backend automatically

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Don't set Content-Type for FormData - browser will set it automatically with boundary
            },
            body: formData,
          });

          if (response.ok) {
            const responseData = await response.json();
            
            // Backend trả về array format: [{"url": "https://...", "resourceType": "image", "publicId": null}]
            // Since we're uploading single file, take first item from array
            const firstItem = Array.isArray(responseData) ? responseData[0] : responseData;
            
            if (!firstItem || !firstItem.url) {
              throw new Error('Invalid response format from server');
            }
            
            return {
              url: firstItem.url,
              fileName: file.name,
              fileSize: file.size,
              cloudName: 'doopw2ezr',
              publicId: firstItem.publicId || undefined,
            };
          } else {
            // Log error for this endpoint but continue trying others
            const errorText = await response.text().catch(() => 'Unknown error');
            lastError = new Error(`Upload failed with status: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          lastError = error;
        }
      }

      // If all endpoints failed, throw the last error
      throw lastError || new Error('All upload endpoints failed');

    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload file (legacy method - giữ lại để tương thích)
   * @param file - File cần upload
   * @param _folder - Thư mục upload (handled by backend)
   * @returns Promise<UploadResponse>
   */
  static async uploadFile(file: File, _folder = 'Audio'): Promise<UploadResponse> {
    return this.uploadImage(file, _folder);
  }

  /**
   * Upload multiple images to Cloudinary in a single request
   * @param files - Array of image files
   * @param _folder - Cloudinary folder (handled by backend automatically)
   * @returns Promise<UploadResponse[]>
   */
  static async uploadMultipleImages(files: File[], _folder = 'Audio'): Promise<UploadResponse[]> {
    try {
      // For seller pages, token is stored as 'seller_token'
      // For customer pages, token is stored as 'accessToken'
      let token = localStorage.getItem('seller_token') || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Access token not found. Please login again.');
      }

      // Validate all files first
      for (const file of files) {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
          throw new Error(`File ${file.name}: ${validation.error}`);
        }
      }

      // Create FormData with multiple files using same key 'files'
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Use the correct endpoint with /api prefix
      const response = await fetch(`${API_BASE_URL}/api/v1/uploads/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Backend returns array of upload results
      if (!Array.isArray(responseData)) {
        throw new Error('Expected array response from server');
      }

      // Map response to our format
      return responseData.map((item: any, index: number) => ({
        url: item.url,
        fileName: files[index]?.name || `file_${index}`,
        fileSize: files[index]?.size || 0,
        cloudName: 'doopw2ezr',
        publicId: item.publicId || undefined,
      }));
      
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files (legacy method - giữ lại để tương thích)
   * @param files - Array of files
   * @param _folder - Folder name (handled by backend)
   * @returns Promise<UploadResponse[]>
   */
  static async uploadMultipleFiles(files: File[], _folder = 'Audio'): Promise<UploadResponse[]> {
    return this.uploadMultipleImages(files, _folder);
  }

  /**
   * Validate image file before upload
   * @param file - File to validate
   * @param maxSize - Max size in bytes (default 10MB cho ảnh)
   * @param allowedTypes - Allowed image file types
   */
  static validateFile(
    file: File, 
    maxSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ): { isValid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Get Cloudinary URL with transformations
   * @param publicId - Cloudinary public ID
   * @param transformations - Cloudinary transformations (e.g., 'w_300,h_300,c_fill')
   * @returns Transformed image URL
   */
  static getTransformedImageUrl(publicId: string, transformations: string = ''): string {
    const cloudName = 'doopw2ezr';
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/`;
    
    if (transformations) {
      return `${baseUrl}${transformations}/${publicId}`;
    }
    
    return `${baseUrl}${publicId}`;
  }

  /**
   * Generate thumbnail URL from Cloudinary URL
   * @param imageUrl - Original Cloudinary image URL
   * @param width - Thumbnail width (default: 200)
   * @param height - Thumbnail height (default: 200)
   * @returns Thumbnail URL
   */
  static generateThumbnail(imageUrl: string, width: number = 200, height: number = 200): string {
    if (!imageUrl.includes('cloudinary.com')) {
      return imageUrl; // Return original if not a Cloudinary URL
    }

    // Extract public ID from URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return imageUrl;
    }

    // Insert transformation parameters
    const transformations = `w_${width},h_${height},c_fill,q_auto,f_auto`;
    urlParts.splice(uploadIndex + 1, 0, transformations);
    
    return urlParts.join('/');
  }
}

export default FileUploadService;