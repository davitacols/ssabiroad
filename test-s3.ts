import { uploadImageToS3 } from './lib/s3-upload';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testS3Upload() {
  try {
    console.log('AWS Credentials:', {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...',
      secretKey: process.env.AWS_SECRET_ACCESS_KEY ? 'present' : 'missing',
      region: process.env.AWS_S3_REGION_NAME
    });
    
    // Create a small test image buffer
    const testBuffer = Buffer.from('test image data');
    const testId = 'test-' + Date.now();
    
    console.log('Testing S3 upload...');
    const url = await uploadImageToS3(testBuffer, testId);
    console.log('✅ Upload successful!');
    console.log('URL:', url);
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
  }
}

testS3Upload();
