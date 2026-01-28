import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { prefetch } from 'remotion';
import { VideoSequence, MediaItem } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';
import { backgroundAudio, mediaAssets } from './media-schema';

// Use proxy in production, direct URLs in development
const getMediaUrls = () => {
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  // For now, use direct URLs (we can add proxy logic later if needed)
  return mediaAssets;
};

const mediaItems = getMediaUrls();

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{[key: number]: number}>({});
  const [allPrefetched, setAllPrefetched] = useState(false);
  const [startedLoading, setStartedLoading] = useState(false);
  const fps = 30;

  useEffect(() => {
    let mounted = true;

    const calculateDurationsAndPrefetch = async () => {
      try {
        setStartedLoading(true);
        
        // Process all media assets
        const mediaWithDurations: MediaItem[] = await Promise.all(
          mediaItems.map(async (asset, index) => {
            if (asset.type === 'video') {
              const metadata = await getVideoMetadata(asset.src);
              const durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
              return {
                type: 'video' as const,
                src: asset.src,
                durationInFrames,
              };
            } else {
              // For images, use the specified duration
              const durationInFrames = Math.ceil((asset.durationInSeconds || 3) * fps);
              return {
                type: 'image' as const,
                src: asset.src,
                durationInFrames,
              };
            }
          })
        );
        
        if (!mounted) return;

        const totalFrames = mediaWithDurations.reduce((sum, m) => sum + m.durationInFrames, 0);
        
        setMedia(mediaWithDurations);
        setTotalDuration(totalFrames);

        // Simulate minimum progress for better UX
        mediaItems.forEach((_, index) => {
          setLoadingProgress(prev => ({ ...prev, [index]: 0 }));
        });

        // Also prefetch the background audio
        const audioUrl = backgroundAudio.src;
        
        const audioPrefetch = prefetch(audioUrl, {
          method: 'blob-url',
        });

        // Then, prefetch all media with progress tracking
        const prefetchPromises = mediaItems.map((asset, index) => {
          const { waitUntilDone } = prefetch(asset.src, {
            method: 'blob-url',
            onProgress: (progress) => {
              if (mounted && progress.totalBytes) {
                const percent = Math.round((progress.loadedBytes / progress.totalBytes) * 100);
                if (!isNaN(percent)) {
                  setLoadingProgress(prev => ({ ...prev, [index]: percent }));
                }
              }
            },
          });
          return waitUntilDone();
        });

        // Wait for media and audio to prefetch
        await Promise.all([...prefetchPromises, audioPrefetch.waitUntilDone()]);
        
        // Ensure all show 100% before completing
        if (mounted) {
          mediaItems.forEach((_, index) => {
            setLoadingProgress(prev => ({ ...prev, [index]: 100 }));
          });
          
          // Small delay to show 100% state
          await new Promise(resolve => setTimeout(resolve, 300));
          setAllPrefetched(true);
        }
      } catch (error) {
        console.error('Error loading media:', error);
        // Still show player even if prefetch fails
        if (mounted) {
          setAllPrefetched(true);
          if (!totalDuration) {
            setTotalDuration(900);
          }
        }
      }
    };

    calculateDurationsAndPrefetch();

    return () => {
      mounted = false;
    };
  }, []);

  if (!totalDuration || !media || !allPrefetched) {
    const overallProgress = Object.keys(loadingProgress).length > 0
      ? Math.round(Object.values(loadingProgress).reduce((a, b) => a + b, 0) / mediaItems.length)
      : 0;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        height: '100dvh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '2rem',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ marginBottom: '2rem' }}>Loading media...</h2>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${overallProgress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease',
              borderRadius: '4px'
            }} />
          </div>
          
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            {overallProgress}% complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      height: '100dvh',
      backgroundColor: '#1a1a1a',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <Player
          component={VideoSequence}
          durationInFrames={totalDuration}
          fps={fps}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: '100%',
            outline: 'none',
          }}
          controls
          autoPlay={false}
          inputProps={{ media }}
        />
      </div>
    </div>
  );
};
