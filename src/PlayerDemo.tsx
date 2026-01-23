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
  const [loadingProgress, setLoadingProgress] = useState<Record<number, number>>({});
  const [isPrefetched, setIsPrefetched] = useState(false);
  const fps = 30;

  useEffect(() => {
    let mounted = true;

    const loadAndPrefetchVideos = async () => {
      try {
        // Step 1: Get metadata
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

        // Step 2: Prefetch all videos
        const prefetchPromises = videoUrls.map((url, index) => {
          const { waitUntilDone } = prefetch(url, {
            method: 'blob-url',
            onProgress: ({ loaded, total }) => {
              if (total) {
                const progress = Math.round((loaded / total) * 100);
                setLoadingProgress(prev => ({ ...prev, [index]: progress }));
              }
            },
          });
          return waitUntilDone();
        });

        await Promise.all(prefetchPromises);
        
        if (mounted) {
          setIsPrefetched(true);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback - still show player even if prefetch fails
        if (mounted) {
          setIsPrefetched(true);
        }
      }
    };

    loadAndPrefetchVideos();

    return () => {
      mounted = false;
    };
  }, []);

  if (!totalDuration || !videos || !isPrefetched) {
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
        <h2 style={{ marginBottom: '2rem' }}>Loading Videos...</h2>
        
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '2rem'
        }}>
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
          
          <p style={{
            textAlign: 'center',
            color: '#888',
            fontSize: '0.9rem'
          }}>
            {overallProgress}% complete
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '500px'
        }}>
          {videoUrls.map((url, index) => {
            const progress = loadingProgress[index] || 0;
            const isDone = progress === 100;
            const name = url.split('/').pop()?.replace('.mp4', '') || '';
            
            return (
              <div key={index} style={{
                padding: '1rem',
                backgroundColor: isDone ? '#1a3a1a' : '#222',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.3s ease'
              }}>
                <span style={{ fontSize: '0.9rem' }}>
                  {name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
                <span style={{
                  color: isDone ? '#4ade80' : '#888',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {isDone ? '✓' : `${progress}%`}
                </span>
              </div>
            );
          })}
        </div>

        <p style={{
          marginTop: '2rem',
          color: '#666',
          fontSize: '0.85rem'
        }}>
          Prefetching for smooth playback...
        </p>
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
