export interface MediaItem {
  name: string;
  url: string;
  type: 'image' | 'video';
  lastModified: Date;
  size: number;
}

export interface Album {
  name: string;
  path: string;
  thumbnail?: string;
  itemCount: number;
}

export interface BlobConfig {
  accountName: string;
  containerName: string;
  sasToken: string;
}
