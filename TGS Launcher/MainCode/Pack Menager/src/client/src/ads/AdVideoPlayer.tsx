import React, { useEffect, useRef } from 'react';
import type { AdPlayerProps } from './types';

async function startPlayback(video: HTMLVideoElement) {
  try {
    await video.play();
    return;
  } catch {
    // Autoplay blocked — try muted (works in Electron/browser without click)
    video.muted = true;
    await video.play();
    video.muted = false;
  }
}

export const AdVideoPlayer: React.FC<AdPlayerProps> = ({
  ad,
  onProgress,
  onComplete,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration || !Number.isFinite(video.duration)) return;
      const percent = (video.currentTime / video.duration) * 100;
      onProgress(percent);

      const minPercent = ad.minWatchPercent ?? 100;
      if (!completedRef.current && percent >= minPercent) {
        completedRef.current = true;
        onComplete();
      }
    };

    const handleEnded = () => {
      if (!completedRef.current) {
        completedRef.current = true;
        onProgress(100);
        onComplete();
      }
    };

    const handleError = () => {
      onError('Failed to load ad video');
    };

    const handleCanPlay = () => {
      startPlayback(video).catch(() => onError('Failed to play ad video'));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    video.load();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [ad.id, ad.minWatchPercent, ad.url, onComplete, onError, onProgress]);

  return (
    <video
      ref={videoRef}
      src={ad.url}
      className="w-full h-full object-contain bg-black"
      playsInline
      autoPlay
      controls={false}
      disablePictureInPicture
      controlsList="nodownload noplaybackrate noremoteplayback"
    />
  );
};
