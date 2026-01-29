import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { prefetch } from 'remotion';
import { VideoSequence, MediaItem } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';
import { backgroundAudioTracks, mediaAssets } from './media-schema';

/** In dev, rewrite CDN URLs to same-origin proxy to avoid CORS. Production uses direct URLs. */
function getMediaUrl(url: string): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (url.startsWith('https://photos-r2.tribute.co/'))
      return `${origin}/photos-r2-proxy${url.slice('https://photos-r2.tribute.co'.length)}`;
    if (url.startsWith('https://tribute-production-encode.b-cdn.net/'))
      return `${origin}/encode-proxy${url.slice('https://tribute-production-encode.b-cdn.net'.length)}`;
  }
  return url;
}

/** TransitionSeries.Transition fade length; each sequence must be at least this long. */
const MIN_SEQUENCE_DURATION_FRAMES = 10;

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{[key: number]: number}>({});
  const [allPrefetched, setAllPrefetched] = useState(false);
  const [startedLoading, setStartedLoading] = useState(false);
  const fps = 30;

  useEffect(() => {
    let mounted = true;
    const proxiedItems = mediaAssets.map((asset) => ({
      ...asset,
      src: getMediaUrl(asset.src),
    }));

    const calculateDurationsAndPrefetch = async () => {
      try {
        setStartedLoading(true);
        
        // Process all media assets (use proxied URLs in dev to avoid CORS)
        const mediaWithDurations: MediaItem[] = await Promise.all(
          proxiedItems.map(async (asset) => {
            let durationInFrames: number;
            if (asset.type === 'video') {
              const metadata = await getVideoMetadata(asset.src);
              durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
            } else {
              durationInFrames = Math.ceil((asset.durationInSeconds ?? 3) * fps);
            }
            // TransitionSeries requires each sequence to be at least as long as the transition
            durationInFrames = Math.max(durationInFrames, MIN_SEQUENCE_DURATION_FRAMES);
            return {
              type: asset.type,
              src: asset.src,
              durationInFrames,
            };
          })
        );
        
        if (!mounted) return;

        const totalFrames = mediaWithDurations.reduce((sum, m) => sum + m.durationInFrames, 0);
        
        setMedia(mediaWithDurations);
        setTotalDuration(totalFrames);

        // Simulate minimum progress for better UX
        proxiedItems.forEach((_, index) => {
          setLoadingProgress(prev => ({ ...prev, [index]: 0 }));
        });

        // Also prefetch all background audio tracks
        const audioPrefetches = backgroundAudioTracks.map((track) =>
          prefetch(track.src, { method: 'blob-url' })
        );

        // Then, prefetch all media with progress tracking
        const prefetchPromises = proxiedItems.map((asset, index) => {
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
        await Promise.all([
          ...prefetchPromises,
          ...audioPrefetches.map((p) => p.waitUntilDone()),
        ]);
        
        // Ensure all show 100% before completing
        if (mounted) {
          proxiedItems.forEach((_, index) => {
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
      ? Math.round(Object.values(loadingProgress).reduce((a, b) => a + b, 0) / mediaAssets.length)
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
