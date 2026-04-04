import fs from 'fs';
import crypto from 'crypto';
import { Readable } from 'stream';
import { google } from 'googleapis';

const DRIVE_UPLOAD_SCOPE = ['https://www.googleapis.com/auth/drive.file'];

type GoogleCredentialSource =
  | { credentials: Record<string, any>; sourceLabel: string }
  | { keyFile: string; sourceLabel: string };

export interface GoogleDriveUploadConfigSummary {
  available: boolean;
  folderConfigured: boolean;
  sourceLabel: string | null;
}

function parseJsonCredentialValue(value: string): Record<string, any> {
  const normalized = value.trim().replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
  return JSON.parse(normalized);
}

function resolveGoogleCredentialSource(logErrors: boolean): GoogleCredentialSource {
  const inlineCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (inlineCredentials) {
    try {
      return {
        credentials: parseJsonCredentialValue(inlineCredentials),
        sourceLabel: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      };
    } catch (error) {
      if (logErrors) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON for Drive upload:', message);
      }
    }
  }

  const base64Credentials = process.env.GCLOUD_CREDENTIALS;
  if (base64Credentials) {
    try {
      return {
        credentials: JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8')),
        sourceLabel: 'GCLOUD_CREDENTIALS',
      };
    } catch (error) {
      if (logErrors) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to parse GCLOUD_CREDENTIALS for Drive upload:', message);
      }
    }
  }

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (keyFile) {
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Google credentials file not found at: ${keyFile}`);
    }

    return {
      keyFile,
      sourceLabel: 'GOOGLE_APPLICATION_CREDENTIALS',
    };
  }

  throw new Error(
    'Google Drive credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON, GCLOUD_CREDENTIALS, or GOOGLE_APPLICATION_CREDENTIALS.',
  );
}

function getGoogleCredentialSource(): GoogleCredentialSource {
  return resolveGoogleCredentialSource(true);
}

export function getGoogleDriveUploadConfigSummary(): GoogleDriveUploadConfigSummary {
  try {
    const credentialSource = resolveGoogleCredentialSource(false);
    return {
      available: true,
      folderConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()),
      sourceLabel: credentialSource.sourceLabel,
    };
  } catch {
    return {
      available: false,
      folderConfigured: false,
      sourceLabel: null,
    };
  }
}

export async function uploadImageToGoogleDrive(
  imageBuffer: Buffer,
  recognitionId: string,
): Promise<string> {
  const credentialSource = getGoogleCredentialSource();
  const auth =
    'credentials' in credentialSource
      ? new google.auth.GoogleAuth({
          credentials: credentialSource.credentials,
          scopes: DRIVE_UPLOAD_SCOPE,
        })
      : new google.auth.GoogleAuth({
          keyFile: credentialSource.keyFile,
          scopes: DRIVE_UPLOAD_SCOPE,
        });

  const drive = google.drive({ version: 'v3', auth });
  const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  const name = `recognition-${recognitionId}-${imageHash}.jpg`;

  const createResponse = await drive.files.create({
    requestBody: {
      name,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: {
      mimeType: 'image/jpeg',
      body: Readable.from(imageBuffer),
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  const fileId = createResponse.data.id;
  if (!fileId) {
    throw new Error(`Google Drive upload completed without a file ID (${credentialSource.sourceLabel})`);
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  return `https://drive.google.com/uc?id=${fileId}`;
}
