import { uploadImageToS3 } from './s3-upload';
import {
  getGoogleDriveUploadConfigSummary,
  uploadImageToGoogleDrive,
} from './google-drive-upload';

let hasLoggedUploadConfig = false;

function logUploadConfigOnce(context: string): void {
  if (hasLoggedUploadConfig) {
    return;
  }

  hasLoggedUploadConfig = true;

  const s3Configured = Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      process.env.AWS_S3_BUCKET_NAME?.trim(),
  );
  const googleConfig = getGoogleDriveUploadConfigSummary();
  const strategy = s3Configured
    ? googleConfig.available
      ? 's3->google'
      : 's3-only'
    : googleConfig.available
      ? 'google-only'
      : 'disabled';

  console.log(`${context}: cloud upload configuration`, {
    strategy,
    s3Configured,
    googleConfigured: googleConfig.available,
    googleCredentialSource: googleConfig.sourceLabel,
    googleDriveFolderConfigured: googleConfig.folderConfigured,
  });
}

export async function uploadImageWithGoogleFallback(
  imageBuffer: Buffer,
  uploadId: string,
  context: string,
): Promise<string | null> {
  logUploadConfigOnce(context);

  try {
    const imageUrl = await uploadImageToS3(imageBuffer, uploadId);
    console.log(`${context}: image uploaded to S3`, { imageUrl });
    return imageUrl;
  } catch (s3Error) {
    const s3Message = s3Error instanceof Error ? s3Error.message : String(s3Error);
    console.error(`${context}: S3 upload failed, trying Google fallback:`, s3Message);
  }

  try {
    const imageUrl = await uploadImageToGoogleDrive(imageBuffer, uploadId);
    console.log(`${context}: image uploaded to Google fallback`, { imageUrl });
    return imageUrl;
  } catch (googleError) {
    const googleMessage = googleError instanceof Error ? googleError.message : String(googleError);
    console.error(`${context}: Google fallback upload failed:`, googleMessage);
    return null;
  }
}
