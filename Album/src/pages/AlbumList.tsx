import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { listContents } from '../services/blobService';
import type { Album, MediaItem } from '../types';
import MediaViewer from '../components/MediaViewer';
import VideoThumbnail from '../components/VideoThumbnail';

export default function AlbumList() {
  const { config } = useConfig();
  const [searchParams] = useSearchParams();
  const prefix = searchParams.get('prefix') ?? '';
  const [albums, setAlbums] = useState<Album[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [thumbBatch, setThumbBatch] = useState(20);
  const nextMarkerRef = useRef('');
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const loadMoreMedia = useCallback(async () => {
    if (!config || !hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const result = await listContents(config, prefix, nextMarkerRef.current);
      setMediaItems(prev => [...prev, ...result.mediaItems]);
      nextMarkerRef.current = result.nextMarker;
      hasMoreRef.current = result.hasMore;
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [config, prefix]);

  // Auto-load next page when current page finishes loading
  useEffect(() => {
    if (!loadingMore && hasMoreRef.current && !loading) {
      loadMoreMedia();
    }
  }, [loadingMore, loading, loadMoreMedia]);

  // Progressively activate video thumbnails in batches of 20
  useEffect(() => {
    const videoCount = mediaItems.filter(i => i.type === 'video').length;
    if (thumbBatch < videoCount) {
      const timer = setTimeout(() => setThumbBatch(b => b + 20), 1000);
      return () => clearTimeout(timer);
    }
  }, [thumbBatch, mediaItems]);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setMediaItems([]);
    setAlbums([]);
    setThumbBatch(20);
    nextMarkerRef.current = '';
    hasMoreRef.current = false;

    listContents(config, prefix)
      .then((result) => {
        if (cancelled) return;
        setAlbums(result.albums);
        setMediaItems(result.mediaItems);
        nextMarkerRef.current = result.nextMarker;
        hasMoreRef.current = result.hasMore;
        setLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [config, prefix]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (viewerIndex === null) return;
      if (e.key === 'ArrowRight') setViewerIndex(i => (i !== null && i < mediaItems.length - 1 ? i + 1 : i));
      if (e.key === 'ArrowLeft') setViewerIndex(i => (i !== null && i > 0 ? i - 1 : i));
      if (e.key === 'Escape') setViewerIndex(null);
    },
    [viewerIndex, mediaItems.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return <div className="loading">Loading albums...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  const breadcrumbs = prefix ? prefix.split('/').filter(Boolean) : [];

  return (
    <div className="album-list-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        {breadcrumbs.map((crumb, i) => {
          const path = breadcrumbs.slice(0, i + 1).join('/') + '/';
          return (
            <span key={path}>
              <span className="breadcrumb-sep">/</span>
              <Link to={`/?prefix=${encodeURIComponent(path)}`}>{crumb}</Link>
            </span>
          );
        })}
      </div>

      <div className="page-header">
        <h1>{prefix ? breadcrumbs[breadcrumbs.length - 1] : 'Albums'}</h1>
        {mediaItems.length > 0 && <span className="item-count">{mediaItems.length} items</span>}
      </div>

      {albums.length === 0 && mediaItems.length === 0 ? (
        <div className="empty-state">
          <p>No albums or media found in this folder.</p>
        </div>
      ) : (
        <>
          {albums.length > 0 && (
            <div className="album-grid">
              {albums.map(album => (
                <Link
                  key={album.path}
                  to={`/?prefix=${encodeURIComponent(album.path)}`}
                  className="album-card"
                >
                  <div className="album-thumbnail">
                    {album.thumbnail ? (
                      <img src={album.thumbnail} alt={album.name} loading="lazy" />
                    ) : (
                      <div className="album-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="album-info">
                    <h3>{album.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {mediaItems.length > 0 && (
            <>
              {albums.length > 0 && <h2 className="section-title">Files</h2>}
              <div className="media-grid">
                {mediaItems.map((item, index) => {
                  const videoIndex = item.type === 'video'
                    ? mediaItems.slice(0, index).filter(i => i.type === 'video').length
                    : -1;
                  return (
                    <div
                      key={item.url}
                      className="media-card"
                      onClick={() => setViewerIndex(index)}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} loading="lazy" decoding="async" />
                      ) : (
                        <div className="video-thumb">
                          <VideoThumbnail src={item.url} alt={item.name} active={videoIndex < thumbBatch} />
                          <div className="video-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="media-name">{item.name}</div>
                    </div>
                  );
                })}
              </div>
              {loadingMore && <div className="loading">Loading more...</div>}
            </>
          )}

          {viewerIndex !== null && mediaItems[viewerIndex] && (
            <MediaViewer
              items={mediaItems}
              currentIndex={viewerIndex}
              onClose={() => setViewerIndex(null)}
              onNavigate={setViewerIndex}
            />
          )}
        </>
      )}
    </div>
  );
}
