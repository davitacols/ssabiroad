import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_S3_REGION_NAME || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'pic2nav-blog-2025';

export async function uploadImageToS3(
  imageBuffer: Buffer,
  recognitionId: string
): Promise<string> {
  const s3Client = getS3Client();
  const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
  const key = `navisense-training/${recognitionId}-${imageHash}.jpg`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
    })
  );

  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
