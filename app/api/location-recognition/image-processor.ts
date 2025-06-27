/**
 * Optimized Image Processor
 * 
 * This module provides optimized image processing functions for faster analysis.
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import { getConfig } from './config';

/**
 * Optimize an image for faster processing
 * @param buffer Original image buffer
 * @returns Optimized image buffer
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    // Get image info
    const metadata = await sharp(buffer).metadata();
    
    // Skip optimization if image is already small
    if ((metadata.width || 0) <= 800 && (metadata.height || 0) <= 800) {
      return buffer;
    }
    
    // Resize to reasonable dimensions for analysis
    // This significantly improves Vision API performance
    return await sharp(buffer)
      .resize({
        width: 800,
        height: 800,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    console.warn('Image optimization failed, using original image:', error);
    return buffer;
  }
}

/**
 * Calculate image hash for caching
 * @param buffer Image buffer
 * @returns MD5 hash of the image
 */
export function getImageHash(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

/**
 * Determine if an image should be processed in fast mode
 * @param buffer Image buffer
 * @returns True if fast mode should be used
 */
export function shouldUseFastMode(buffer: Buffer): boolean {
  // Check if fast mode is enabled in config
  if (!getConfig('performance.fastModeEnabled', true)) {
    return false;
  }
  
  // Use fast mode for large images
  if (buffer.length > 1000000) { // 1MB
    return true;
  }
  
  return false;
}

/**
 * Extract EXIF data from image if available
 * @param buffer Image buffer
 * @returns Object with EXIF data or null if not available
 */
export async function extractEXIFData(buffer: Buffer): Promise<any | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.exif ? metadata.exif : null;
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return null;
  }
}