import { useRef, useEffect } from 'react';
import type { MediaItem } from '../types';

interface MediaViewerProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function MediaViewer({ items, currentIndex, onClose, onNavigate }: MediaViewerProps) {
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item.url, item.type]);

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer" onClick={e => e.stopPropagation()}>
        <button className="viewer-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="viewer-content">
          {hasPrev && (
            <button
              className="viewer-nav viewer-prev"
              onClick={() => onNavigate(currentIndex - 1)}
              aria-label="Previous"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className="viewer-media">
            {item.type === 'image' ? (
              <img src={item.url} alt={item.name} />
            ) : (
              <video key={item.url} ref={videoRef} src={item.url} controls playsInline preload="metadata" />
            )}
          </div>

          {hasNext && (
            <button
              className="viewer-nav viewer-next"
              onClick={() => onNavigate(currentIndex + 1)}
              aria-label="Next"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>

        <div className="viewer-footer">
          <span className="viewer-name">{item.name}</span>
          <span className="viewer-counter">{currentIndex + 1} / {items.length}</span>
        </div>
      </div>
    </div>
  );
}
