import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { prefetch } from 'remotion';
import { VideoSequence, VideoWithDuration } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';

// Use proxy in production, direct URLs in development
const getVideoUrls = () => {
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  if (isProduction) {
    return [
      '/api/videos/sloth_on_train.mp4',
      '/api/videos/mongolian_horses_4k.mp4',
      '/api/videos/magical_ink.mp4',
    ];
  }
  
  return [
    'https://tribute-video-assets.tribute.co/sloth_on_train.mp4',
    'https://tribute-video-assets.tribute.co/mongolian_horses_4k.mp4',
    'https://tribute-video-assets.tribute.co/magical_ink.mp4',
  ];
};

const videoUrls = getVideoUrls();

export const PlayerDemo: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithDuration[] | null>(null);
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
        
        // First, get metadata
        const metadataPromises = videoUrls.map(url => getVideoMetadata(url));
        const allMetadata = await Promise.all(metadataPromises);
        
        if (!mounted) return;

        const videosWithDurations = videoUrls.map((src, index) => {
          const metadata = allMetadata[index];
          const durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
          return {
            src,
            durationInFrames,
          };
        });

        const totalFrames = videosWithDurations.reduce((sum, v) => sum + v.durationInFrames, 0);
        
        setVideos(videosWithDurations);
        setTotalDuration(totalFrames);

        // Simulate minimum progress for better UX
        videoUrls.forEach((_, index) => {
          setLoadingProgress(prev => ({ ...prev, [index]: 0 }));
        });

        // Also prefetch the background audio
        const audioUrl = videoUrls[0].startsWith('/api/videos/') 
          ? '/api/videos/EVOE%20-%20Pearl.mp3'
          : 'https://tribute-video-assets.tribute.co/EVOE%20-%20Pearl.mp3';
        
        const audioPrefetch = prefetch(audioUrl, {
          method: 'blob-url',
        });

        // Then, prefetch all videos with progress tracking
        const prefetchPromises = videoUrls.map((url, index) => {
          const { waitUntilDone } = prefetch(url, {
            method: 'blob-url',
            onProgress: (progress) => {
              if (mounted) {
                const percent = Math.round((progress.downloaded / progress.totalBytes) * 100);
                if (!isNaN(percent)) {
                  setLoadingProgress(prev => ({ ...prev, [index]: percent }));
                }
              }
            },
          });
          return waitUntilDone();
        });

        // Wait for videos and audio to prefetch
        await Promise.all([...prefetchPromises, audioPrefetch.waitUntilDone()]);
        
        // Ensure all show 100% before completing
        if (mounted) {
          videoUrls.forEach((_, index) => {
            setLoadingProgress(prev => ({ ...prev, [index]: 100 }));
          });
          
          // Small delay to show 100% state
          await new Promise(resolve => setTimeout(resolve, 300));
          setAllPrefetched(true);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
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

  if (!totalDuration || !videos || !allPrefetched) {
    const overallProgress = Object.keys(loadingProgress).length > 0
      ? Math.round(Object.values(loadingProgress).reduce((a, b) => a + b, 0) / videoUrls.length)
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
          <h2 style={{ marginBottom: '2rem' }}>Loading videos...</h2>
          
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
          inputProps={{ videos }}
        />
      </div>
    </div>
  );
};
