import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
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
  const fps = 30;

  useEffect(() => {
    let mounted = true;

    const calculateDurations = async () => {
      try {
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
      } catch (error) {
        console.error('Error calculating duration:', error);
        // Fallback to default if there's an error
        if (mounted) {
          setTotalDuration(900);
        }
      }
    };

    calculateDurations();

    return () => {
      mounted = false;
    };
  }, []);

  if (!totalDuration || !videos) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading videos...</h2>
          <p style={{ color: '#888', marginTop: '1rem' }}>Calculating durations with Mediabunny</p>
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
