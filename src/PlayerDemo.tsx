import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { prefetch } from 'remotion';
import { VideoSequence, VideoWithDuration } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';

const videoUrls = [
  'https://tribute-video-assets.tribute.co/sloth_on_train.mp4',
  'https://tribute-video-assets.tribute.co/mongolian_horses_4k.mp4',
  'https://tribute-video-assets.tribute.co/magical_ink.mp4',
];

export const PlayerDemo: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithDuration[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{[key: number]: number}>({});
  const [allPrefetched, setAllPrefetched] = useState(false);
  const fps = 30;

  useEffect(() => {
    let mounted = true;

    const calculateDurationsAndPrefetch = async () => {
      try {
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

        // Then, prefetch all videos with progress tracking
        const prefetchPromises = videoUrls.map((url, index) => {
          const { waitUntilDone } = prefetch(url, {
            method: 'blob-url',
            onProgress: ({ loaded, total }) => {
              if (total) {
                const percent = Math.round((loaded / total) * 100);
                setLoadingProgress(prev => ({ ...prev, [index]: percent }));
              }
            },
          });
          return waitUntilDone();
        });

        await Promise.all(prefetchPromises);
        
        if (mounted) {
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
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '2rem'
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
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{
        color: '#fff',
        marginBottom: '2rem',
        fontSize: '2.5rem',
        fontWeight: 'bold'
      }}>
        Remotion Player Demo
      </h1>

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
