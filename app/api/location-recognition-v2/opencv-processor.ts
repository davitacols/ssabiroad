import sharp from 'sharp';

export class OpenCVProcessor {
  // Enhance image for better text detection
  static async enhanceForOCR(buffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Convert to grayscale and enhance contrast
      const enhanced = await image
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
      
      return enhanced;
    } catch (error) {
      console.log('OCR enhancement failed:', error.message);
      return buffer;
    }
  }

  // Correct perspective distortion in signs
  static async correctPerspective(buffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Auto-rotate based on EXIF orientation
      const corrected = await image
        .rotate()
        .toBuffer();
      
      return corrected;
    } catch (error) {
      console.log('Perspective correction failed:', error.message);
      return buffer;
    }
  }

  // Enhance building edges for landmark detection
  static async enhanceEdges(buffer: Buffer): Promise<Buffer> {
    try {
      const enhanced = await sharp(buffer)
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .toBuffer();
      
      return enhanced;
    } catch (error) {
      console.log('Edge enhancement failed:', error.message);
      return buffer;
    }
  }

  // Check image quality before processing
  static async checkQuality(buffer: Buffer): Promise<{isGood: boolean, reason?: string}> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const stats = await image.stats();
      
      // Check resolution
      if (metadata.width < 200 || metadata.height < 200) {
        return { isGood: false, reason: 'Image resolution too low' };
      }
      
      // Check if image is too dark
      const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
      if (avgBrightness < 30) {
        return { isGood: false, reason: 'Image too dark' };
      }
      
      // Check if image is too bright (overexposed)
      if (avgBrightness > 240) {
        return { isGood: false, reason: 'Image overexposed' };
      }
      
      return { isGood: true };
    } catch (error) {
      console.log('Quality check failed:', error.message);
      return { isGood: true }; // Assume good if check fails
    }
  }

  // Denoise image for clearer features
  static async denoise(buffer: Buffer): Promise<Buffer> {
    try {
      const denoised = await sharp(buffer)
        .median(3)
        .toBuffer();
      
      return denoised;
    } catch (error) {
      console.log('Denoising failed:', error.message);
      return buffer;
    }
  }

  // Comprehensive preprocessing pipeline
  static async preprocess(buffer: Buffer, options: {
    enhanceText?: boolean,
    correctPerspective?: boolean,
    denoise?: boolean
  } = {}): Promise<Buffer> {
    try {
      let processed = buffer;
      
      // Check quality first
      const quality = await this.checkQuality(processed);
      if (!quality.isGood) {
        console.log('Image quality issue:', quality.reason);
      }
      
      // Apply corrections
      if (options.correctPerspective) {
        processed = await this.correctPerspective(processed);
      }
      
      if (options.denoise) {
        processed = await this.denoise(processed);
      }
      
      if (options.enhanceText) {
        processed = await this.enhanceForOCR(processed);
      }
      
      return processed;
    } catch (error) {
      console.log('Preprocessing failed:', error.message);
      return buffer;
    }
  }
}
