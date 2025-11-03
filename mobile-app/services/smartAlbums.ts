import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhotoMetadata } from './aiCategorization';

export interface SmartAlbum {
  id: string;
  name: string;
  type: 'category' | 'style' | 'region' | 'period' | 'custom';
  filter: AlbumFilter;
  photoCount: number;
  coverPhoto?: string;
  createdAt: string;
}

export interface AlbumFilter {
  categories?: string[];
  styles?: string[];
  regions?: string[];
  periods?: string[];
  tags?: string[];
}

const STORAGE_KEY = '@smart_albums';

export const createSmartAlbum = async (name: string, type: SmartAlbum['type'], filter: AlbumFilter): Promise<SmartAlbum> => {
  const album: SmartAlbum = {
    id: Date.now().toString(),
    name,
    type,
    filter,
    photoCount: 0,
    createdAt: new Date().toISOString(),
  };
  
  const albums = await getSmartAlbums();
  albums.push(album);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
  
  return album;
};

export const getSmartAlbums = async (): Promise<SmartAlbum[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateAlbumCounts = async (photos: PhotoMetadata[]): Promise<void> => {
  const albums = await getSmartAlbums();
  
  albums.forEach(album => {
    album.photoCount = filterPhotosForAlbum(photos, album.filter).length;
    if (album.photoCount > 0 && !album.coverPhoto) {
      album.coverPhoto = filterPhotosForAlbum(photos, album.filter)[0].uri;
    }
  });
  
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
};

export const filterPhotosForAlbum = (photos: PhotoMetadata[], filter: AlbumFilter): PhotoMetadata[] => {
  return photos.filter(photo => {
    if (filter.categories && !filter.categories.includes(photo.category)) return false;
    if (filter.styles && photo.architecturalStyle && !filter.styles.includes(photo.architecturalStyle)) return false;
    if (filter.regions && photo.region && !filter.regions.includes(photo.region)) return false;
    if (filter.periods && photo.timePeriod && !filter.periods.includes(photo.timePeriod)) return false;
    if (filter.tags && !filter.tags.some(tag => photo.tags.includes(tag))) return false;
    return true;
  });
};

export const deleteSmartAlbum = async (id: string): Promise<void> => {
  const albums = await getSmartAlbums();
  const filtered = albums.filter(a => a.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getDefaultAlbums = (): Omit<SmartAlbum, 'id' | 'photoCount' | 'createdAt'>[] => [
  { name: 'Landmarks', type: 'category', filter: { categories: ['landmark'] } },
  { name: 'Victorian Buildings', type: 'style', filter: { styles: ['Victorian'] } },
  { name: 'Modern Architecture', type: 'style', filter: { styles: ['Modern', 'Minimalist'] } },
  { name: 'Historical Sites', type: 'category', filter: { categories: ['historical'] } },
  { name: 'Urban Scenes', type: 'category', filter: { categories: ['urban', 'commercial'] } },
  { name: 'Nature & Parks', type: 'category', filter: { categories: ['nature'] } },
];
