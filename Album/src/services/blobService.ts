import type { Album, BlobConfig, MediaItem } from '../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];

function getMediaType(name: string): 'image' | 'video' | null {
  const lower = name.toLowerCase();
  if (IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'image';
  if (VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))) return 'video';
  return null;
}

function buildBaseUrl(config: BlobConfig): string {
  return `https://${config.accountName}.blob.core.windows.net/${config.containerName}`;
}

/** In dev, route fetch calls through Vite proxy to avoid CORS. */
function buildFetchUrl(config: BlobConfig): string {
  if (import.meta.env.DEV) {
    return `/azure-blob/${config.containerName}`;
  }
  return buildBaseUrl(config);
}

function appendSas(url: string, sasToken: string): string {
  const token = sasToken.startsWith('?') ? sasToken : `?${sasToken}`;
  return `${url}${token}`;
}

interface BlobItem {
  Name: string;
  Properties: {
    'Last-Modified'?: string;
    'Content-Length'?: string;
  };
}

interface BlobPrefix {
  Name: string;
}

/**
 * List blobs using the Azure Blob Storage REST API with SAS token.
 * Uses delimiter='/' to get virtual directories (albums) and blobs (media).
 */
async function listBlobs(
  config: BlobConfig,
  prefix: string = '',
  marker: string = '',
  maxResults: number = 50
): Promise<{ blobs: BlobItem[]; prefixes: BlobPrefix[]; nextMarker: string }> {

  const sasToken = config.sasToken.startsWith('?') ? config.sasToken.slice(1) : config.sasToken;

  const fetchUrl = buildFetchUrl(config);
  const listParams = `restype=container&comp=list&delimiter=/&maxresults=${maxResults}`
    + (prefix ? `&prefix=${encodeURIComponent(prefix)}` : '')
    + (marker ? `&marker=${encodeURIComponent(marker)}` : '');
  const requestUrl = `${fetchUrl}?${listParams}&${sasToken}`;
  const response = await fetch(requestUrl);
  if (!response.ok) {
    const body = await response.text();
    console.error('[blobService] Error response:', body);
    throw new Error(`Failed to list blobs: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');

  const blobs: BlobItem[] = [];
  const blobElements = xml.querySelectorAll('Blobs > Blob');
  for (const blob of blobElements) {
    const name = blob.querySelector('Name')?.textContent ?? '';
    const lastModified = blob.querySelector('Properties > Last-Modified')?.textContent ?? '';
    const contentLength = blob.querySelector('Properties > Content-Length')?.textContent ?? '0';
    blobs.push({
      Name: name,
      Properties: {
        'Last-Modified': lastModified,
        'Content-Length': contentLength,
      },
    });
  }

  const prefixes: BlobPrefix[] = [];
  const prefixElements = xml.querySelectorAll('Blobs > BlobPrefix');
  for (const p of prefixElements) {
    const name = p.querySelector('Name')?.textContent ?? '';
    prefixes.push({ Name: name });
  }

  const nextMarker = xml.querySelector('NextMarker')?.textContent ?? '';

  return { blobs, prefixes, nextMarker };
}

export interface ContentsResult {
  albums: Album[];
  mediaItems: MediaItem[];
  nextMarker: string;
  hasMore: boolean;
}

/**
 * List contents at a prefix — returns albums (without thumbnails) and media items in one call.
 */
export async function listContents(config: BlobConfig, prefix: string = '', marker: string = ''): Promise<ContentsResult> {
  const result = await listBlobs(config, prefix, marker, 100);

  const mediaItems = result.blobs
    .map(blob => {
      const mediaType = getMediaType(blob.Name);
      if (!mediaType) return null;
      const fileName = blob.Name.split('/').pop() ?? blob.Name;
      const encodedPath = blob.Name.split('/').map(encodeURIComponent).join('/');
      return {
        name: fileName,
        url: appendSas(`${buildBaseUrl(config)}/${encodedPath}`, config.sasToken),
        type: mediaType,
        lastModified: new Date(blob.Properties['Last-Modified'] ?? ''),
        size: parseInt(blob.Properties['Content-Length'] ?? '0', 10),
      } satisfies MediaItem;
    })
    .filter((item): item is MediaItem => item !== null);

  const albums: Album[] = result.prefixes
    .map(p => {
      const albumName = p.Name.replace(prefix, '').replace(/\/$/, '');
      if (!albumName) return null;
      return { name: albumName, path: p.Name, itemCount: 0 } satisfies Album;
    })
    .filter((a): a is Album => a !== null);

  return { albums, mediaItems, nextMarker: result.nextMarker, hasMore: result.nextMarker !== '' };
}

/**
 * Fetch thumbnail for a single album. Returns updated album with thumbnail + itemCount.
 */
export async function fetchAlbumThumbnail(config: BlobConfig, album: Album): Promise<Album> {
  try {
    const peek = await listBlobs(config, album.path, '', 10);
    const firstImage = peek.blobs.find(b => getMediaType(b.Name) === 'image');
    const thumbnail = firstImage
      ? appendSas(`${buildBaseUrl(config)}/${firstImage.Name.split('/').map(encodeURIComponent).join('/')}`, config.sasToken)
      : undefined;
    return {
      ...album,
      thumbnail,
      itemCount: peek.blobs.length + peek.prefixes.length,
    };
  } catch {
    return album;
  }
}

export interface MediaPage {
  items: MediaItem[];
  nextMarker: string;
  hasMore: boolean;
}

/**
 * Get a page of media items at a given prefix.
 * Returns a batch + marker for the next page.
 */
export async function getMediaPage(
  config: BlobConfig,
  prefix: string = '',
  marker: string = '',
  pageSize: number = 30
): Promise<MediaPage> {
  const result = await listBlobs(config, prefix, marker, pageSize);

  const items = result.blobs
    .map(blob => {
      const mediaType = getMediaType(blob.Name);
      if (!mediaType) return null;
      const fileName = blob.Name.split('/').pop() ?? blob.Name;
      const encodedPath = blob.Name.split('/').map(encodeURIComponent).join('/');
      return {
        name: fileName,
        url: appendSas(`${buildBaseUrl(config)}/${encodedPath}`, config.sasToken),
        type: mediaType,
        lastModified: new Date(blob.Properties['Last-Modified'] ?? ''),
        size: parseInt(blob.Properties['Content-Length'] ?? '0', 10),
      } satisfies MediaItem;
    })
    .filter((item): item is MediaItem => item !== null);

  return {
    items,
    nextMarker: result.nextMarker,
    hasMore: result.nextMarker !== '',
  };
}

/**
 * Check if configs are valid by doing a test list call.
 */
export async function testConnection(config: BlobConfig): Promise<boolean> {
  try {
    await listBlobs(config, '', '');
    return true;
  } catch {
    return false;
  }
}
