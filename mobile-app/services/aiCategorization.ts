// AI Categorization Service
export interface PhotoMetadata {
  uri: string;
  category: LocationCategory;
  architecturalStyle?: string;
  timePeriod?: string;
  region?: string;
  tags: string[];
  similarity?: number;
  timestamp: string;
}

export type LocationCategory = 'landmark' | 'building' | 'nature' | 'urban' | 'residential' | 'commercial' | 'historical' | 'modern';

export const categorizeLocation = (data: any): PhotoMetadata => {
  const category = detectCategory(data);
  const architecturalStyle = detectArchitecturalStyle(data);
  const timePeriod = detectTimePeriod(data);
  const region = detectRegion(data);
  const tags = generateTags(data, category, architecturalStyle);

  return {
    uri: data.uri || '',
    category,
    architecturalStyle,
    timePeriod,
    region,
    tags,
    timestamp: new Date().toISOString(),
  };
};

const detectCategory = (data: any): LocationCategory => {
  const name = (data.name || '').toLowerCase();
  const address = (data.address || '').toLowerCase();
  const labels = data.labels || [];

  if (labels.some((l: string) => /monument|memorial|statue|landmark/i.test(l))) return 'landmark';
  if (labels.some((l: string) => /park|forest|mountain|beach|nature/i.test(l))) return 'nature';
  if (labels.some((l: string) => /shop|store|mall|restaurant|cafe/i.test(l))) return 'commercial';
  if (labels.some((l: string) => /house|apartment|residential/i.test(l))) return 'residential';
  if (name.includes('museum') || name.includes('church') || name.includes('castle')) return 'historical';
  if (labels.some((l: string) => /modern|contemporary|skyscraper/i.test(l))) return 'modern';
  if (address.includes('downtown') || address.includes('city')) return 'urban';
  
  return 'building';
};

const detectArchitecturalStyle = (data: any): string | undefined => {
  const labels = data.labels || [];
  const name = (data.name || '').toLowerCase();
  
  const styles = [
    { keywords: ['gothic', 'cathedral', 'pointed arch'], style: 'Gothic' },
    { keywords: ['victorian', 'ornate', 'turret'], style: 'Victorian' },
    { keywords: ['modern', 'glass', 'steel', 'contemporary'], style: 'Modern' },
    { keywords: ['art deco', 'geometric', 'streamline'], style: 'Art Deco' },
    { keywords: ['colonial', 'columns', 'symmetrical'], style: 'Colonial' },
    { keywords: ['baroque', 'ornamental', 'dramatic'], style: 'Baroque' },
    { keywords: ['minimalist', 'simple', 'clean'], style: 'Minimalist' },
    { keywords: ['industrial', 'brick', 'warehouse'], style: 'Industrial' },
  ];

  for (const { keywords, style } of styles) {
    if (keywords.some(k => name.includes(k) || labels.some((l: string) => l.toLowerCase().includes(k)))) {
      return style;
    }
  }

  return undefined;
};

const detectTimePeriod = (data: any): string | undefined => {
  const name = (data.name || '').toLowerCase();
  const labels = data.labels || [];
  
  if (name.includes('ancient') || labels.some((l: string) => /ancient|ruins/i.test(l))) return 'Ancient';
  if (name.includes('medieval') || labels.some((l: string) => /medieval|castle/i.test(l))) return 'Medieval';
  if (name.includes('renaissance')) return 'Renaissance';
  if (name.includes('victorian') || name.includes('19th century')) return '19th Century';
  if (name.includes('modern') || name.includes('contemporary')) return 'Contemporary';
  
  return undefined;
};

const detectRegion = (data: any): string | undefined => {
  const address = data.address || '';
  
  // Extract city/region from address
  const parts = address.split(',').map((p: string) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2]; // Usually city or state
  }
  
  return undefined;
};

const generateTags = (data: any, category: LocationCategory, style?: string): string[] => {
  const tags = new Set<string>();
  
  tags.add(category);
  if (style) tags.add(style);
  
  const labels = data.labels || [];
  labels.forEach((label: string) => {
    if (label.length > 2 && label.length < 20) {
      tags.add(label.toLowerCase());
    }
  });
  
  const name = (data.name || '').toLowerCase();
  if (name.includes('museum')) tags.add('museum');
  if (name.includes('church')) tags.add('religious');
  if (name.includes('park')) tags.add('outdoor');
  if (name.includes('bridge')) tags.add('infrastructure');
  
  return Array.from(tags);
};

export const searchPhotos = (photos: PhotoMetadata[], query: string): PhotoMetadata[] => {
  const q = query.toLowerCase();
  
  return photos.filter(photo => {
    return (
      photo.category.includes(q) ||
      photo.architecturalStyle?.toLowerCase().includes(q) ||
      photo.timePeriod?.toLowerCase().includes(q) ||
      photo.region?.toLowerCase().includes(q) ||
      photo.tags.some(tag => tag.includes(q))
    );
  });
};

export const groupByCategory = (photos: PhotoMetadata[]): Record<LocationCategory, PhotoMetadata[]> => {
  const groups: any = {};
  
  photos.forEach(photo => {
    if (!groups[photo.category]) {
      groups[photo.category] = [];
    }
    groups[photo.category].push(photo);
  });
  
  return groups;
};

export const groupByStyle = (photos: PhotoMetadata[]): Record<string, PhotoMetadata[]> => {
  const groups: any = {};
  
  photos.forEach(photo => {
    const style = photo.architecturalStyle || 'Unknown';
    if (!groups[style]) {
      groups[style] = [];
    }
    groups[style].push(photo);
  });
  
  return groups;
};

export const groupByRegion = (photos: PhotoMetadata[]): Record<string, PhotoMetadata[]> => {
  const groups: any = {};
  
  photos.forEach(photo => {
    const region = photo.region || 'Unknown';
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(photo);
  });
  
  return groups;
};

export const calculateSimilarity = (photo1: PhotoMetadata, photo2: PhotoMetadata): number => {
  let score = 0;
  
  if (photo1.category === photo2.category) score += 0.3;
  if (photo1.architecturalStyle === photo2.architecturalStyle) score += 0.3;
  if (photo1.region === photo2.region) score += 0.2;
  
  const commonTags = photo1.tags.filter(tag => photo2.tags.includes(tag));
  score += (commonTags.length / Math.max(photo1.tags.length, photo2.tags.length)) * 0.2;
  
  return score;
};

export const findSimilarPhotos = (photo: PhotoMetadata, allPhotos: PhotoMetadata[], threshold = 0.5): PhotoMetadata[] => {
  return allPhotos
    .filter(p => p.uri !== photo.uri)
    .map(p => ({ ...p, similarity: calculateSimilarity(photo, p) }))
    .filter(p => p.similarity! >= threshold)
    .sort((a, b) => b.similarity! - a.similarity!);
};
