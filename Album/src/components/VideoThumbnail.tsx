import { useEffect, useRef } from 'react';

interface VideoThumbnailProps {
  src: string;
  alt: string;
  active: boolean;
}

export default function VideoThumbnail({ src, alt, active }: VideoThumbnailProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (active && ref.current && !ref.current.src) {
      ref.current.src = src;
    }
  }, [active, src]);

  return (
    <video
      ref={ref}
      preload={active ? 'auto' : 'none'}
      muted
      playsInline
      title={alt}
      className="video-thumb-el"
      onLoadedData={() => {
        if (ref.current) ref.current.currentTime = 0.1;
      }}
    />
  );
}
