export type NavisenseTrainingLabelQuality = 'gold' | 'silver' | 'bronze' | 'weak';

export interface NavisenseTrainingMetadata {
  schemaVersion: number;
  source?: string;
  labelQuality?: NavisenseTrainingLabelQuality;
  method?: string;
  providerMethod?: string;
  businessName?: string;
  address?: string;
  addressSource?: string;
  confidence?: number;
  locationPrecision?: string;
  recognitionId?: string;
  userId?: string;
  imageHash?: string;
  imageUrl?: string;
  placeId?: string;
  userCorrected?: boolean;
  latitude?: number;
  longitude?: number;
  trainingPipeline?: string;
  timestamp?: string;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

export function deriveTrainingLabelQuality(
  metadata: Partial<NavisenseTrainingMetadata> = {},
): NavisenseTrainingLabelQuality {
  if (
    metadata.labelQuality === 'gold' ||
    metadata.labelQuality === 'silver' ||
    metadata.labelQuality === 'bronze' ||
    metadata.labelQuality === 'weak'
  ) {
    return metadata.labelQuality;
  }

  const source = normalizeOptionalString(metadata.source)?.toLowerCase() || '';
  const method = normalizeOptionalString(metadata.method)?.toLowerCase() || '';
  const locationPrecision = normalizeOptionalString(metadata.locationPrecision)?.toLowerCase() || '';
  const confidence = normalizeOptionalNumber(metadata.confidence);

  if (
    metadata.userCorrected ||
    source.includes('feedback') ||
    source.includes('manual-tag') ||
    source.includes('user-correction')
  ) {
    return 'gold';
  }

  if (locationPrecision === 'exact' || method.includes('image-address') || method.includes('client-gps')) {
    return confidence !== undefined && confidence >= 0.97 ? 'gold' : 'silver';
  }

  if (confidence !== undefined && confidence >= 0.9) {
    return 'silver';
  }

  if (confidence !== undefined && confidence >= 0.75) {
    return 'bronze';
  }

  return 'weak';
}

export function buildNavisenseTrainingMetadata(
  metadata: Partial<NavisenseTrainingMetadata> = {},
): NavisenseTrainingMetadata {
  const normalized: NavisenseTrainingMetadata = {
    schemaVersion: 2,
    source: normalizeOptionalString(metadata.source),
    method: normalizeOptionalString(metadata.method),
    providerMethod: normalizeOptionalString(metadata.providerMethod),
    businessName: normalizeOptionalString(metadata.businessName),
    address: normalizeOptionalString(metadata.address),
    addressSource: normalizeOptionalString(metadata.addressSource),
    confidence: normalizeOptionalNumber(metadata.confidence),
    locationPrecision: normalizeOptionalString(metadata.locationPrecision),
    recognitionId: normalizeOptionalString(metadata.recognitionId),
    userId: normalizeOptionalString(metadata.userId),
    imageHash: normalizeOptionalString(metadata.imageHash),
    imageUrl: normalizeOptionalString(metadata.imageUrl),
    placeId: normalizeOptionalString(metadata.placeId),
    userCorrected: metadata.userCorrected === true ? true : undefined,
    latitude: normalizeOptionalNumber(metadata.latitude),
    longitude: normalizeOptionalNumber(metadata.longitude),
    trainingPipeline: normalizeOptionalString(metadata.trainingPipeline),
    timestamp: normalizeOptionalString(metadata.timestamp) || new Date().toISOString(),
  };

  normalized.labelQuality = deriveTrainingLabelQuality({
    ...metadata,
    ...normalized,
  });

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as NavisenseTrainingMetadata;
}
