import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export class ImageProcessor {
  static async compressImage(uri, quality = 0.8, maxWidth = 1920, maxHeight = 1080, preserveExif = true) {
    try {
      // If preserveExif is true and image doesn't need resizing, return original
      if (preserveExif) {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.size && info.size < 2 * 1024 * 1024) { // Less than 2MB
          console.log('📸 Image is small enough, preserving original with EXIF data');
          return { uri };
        }
      }
      
      const result = await manipulateAsync(
        uri,
        [
          { resize: { width: maxWidth, height: maxHeight } }
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
          base64: false
        }
      );
      
      if (preserveExif) {
        console.log('⚠️ Image was compressed - EXIF data may be lost');
      }
      
      return result;
    } catch (error) {
      console.error('Image compression failed:', error);
      return { uri };
    }
  }

  static async getImageSize(uri) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.size;
    } catch (error) {
      console.error('Failed to get image size:', error);
      return 0;
    }
  }

  static async optimizeForUpload(uri, targetSizeKB = 500, preserveExif = true) {
    const originalSize = await this.getImageSize(uri);
    
    // If image is already small enough and we want to preserve EXIF, return original
    if (preserveExif && originalSize <= targetSizeKB * 1024) {
      console.log('📸 Image already optimized, preserving original with EXIF data');
      return { uri };
    }
    
    // If preserveExif is true but image is too large, warn about EXIF loss
    if (preserveExif && originalSize > targetSizeKB * 1024) {
      console.log('⚠️ Image too large, compression will strip EXIF data');
    }
    
    let quality = 0.9;
    let result = { uri };
    
    while (quality > 0.1) {
      result = await this.compressImage(uri, quality, 1920, 1080, false); // Don't preserve EXIF during compression
      const size = await this.getImageSize(result.uri);
      
      if (size <= targetSizeKB * 1024) {
        break;
      }
      
      quality -= 0.1;
    }
    
    return result;
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  static async preserveOriginalForGPS(uri) {
    console.log('📍 Preserving original image to maintain GPS/EXIF data');
    return { uri };
  }
}