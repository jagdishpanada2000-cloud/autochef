// Cloudinary Image Service
// Handles all image upload operations via Cloudinary

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  maxWidth?: number;
  maxHeight?: number;
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const imageService = {
  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
    
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: `File is not an image (${file.type}). Please upload an image file.` };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    return { valid: true };
  },

  // Upload image to Cloudinary
  async uploadImage(file: File, options: UploadOptions = {}): Promise<{ data: CloudinaryUploadResult | null; error: Error | null }> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { data: null, error: new Error(validation.error) };
    }

    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      return { data: null, error: new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.') };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Only folder is allowed with unsigned uploads (no transformations)
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload success:', data.secure_url);
      return { data, error: null };
    } catch (error) {
      console.error('Cloudinary upload exception:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Upload failed') };
    }
  },

  // Upload restaurant logo
  async uploadRestaurantLogo(file: File, restaurantId: string): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await this.uploadImage(file, {
      folder: `restaurants/${restaurantId}/logo`,
      maxWidth: 400,
      maxHeight: 400,
    });

    if (error) {
      return { url: null, error };
    }

    return { url: data?.secure_url || null, error: null };
  },

  // Simple upload returning just URL - used by Onboarding page
  async upload(file: File, folder: string = 'general'): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await this.uploadImage(file, {
      folder,
      maxWidth: 1200,
      maxHeight: 1200,
    });

    if (error) {
      return { url: null, error };
    }

    return { url: data?.secure_url || null, error: null };
  },

  // Upload menu item image
  async uploadMenuItemImage(file: File, restaurantId: string): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await this.uploadImage(file, {
      folder: `restaurants/${restaurantId}/menu`,
      maxWidth: 600,
      maxHeight: 600,
    });

    if (error) {
      return { url: null, error };
    }

    return { url: data?.secure_url || null, error: null };
  },

  // Upload user avatar
  async uploadAvatar(file: File, userId: string): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await this.uploadImage(file, {
      folder: `users/${userId}/avatar`,
      maxWidth: 200,
      maxHeight: 200,
    });

    if (error) {
      return { url: null, error };
    }

    return { url: data?.secure_url || null, error: null };
  },

  // Get optimized image URL with transformations
  getOptimizedUrl(url: string, options: { width?: number; height?: number; quality?: string } = {}): string {
    if (!url || !url.includes('cloudinary')) {
      return url;
    }

    const { width, height, quality = 'auto' } = options;
    
    // Build transformation string
    const transformations = [`q_${quality}`, 'f_auto'];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push('c_fill');

    // Insert transformations into URL
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }

    return url;
  },

  // Get thumbnail URL
  getThumbnailUrl(url: string, size: number = 150): string {
    return this.getOptimizedUrl(url, { width: size, height: size });
  },
};
