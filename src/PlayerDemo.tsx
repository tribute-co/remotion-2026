import { Player, PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { getMediaUrl } from './get-media-url';
import { getVideoMetadata } from './get-video-metadata';
import { mediaAssets } from './media-schema';
import { VideoSequence, MediaItem } from './VideoSequence';

const FPS = 30;
const MIN_DURATION_FRAMES = 1;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

function isMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod|Android|webOS|Mobile|Tablet/i.test(navigator.userAgent) ||
    'ontouchstart' in window
  );
}

async function calculateMediaDurations(fps: number): Promise<MediaItem[]> {
  const proxiedAssets = mediaAssets.map((asset) => ({
    ...asset,
    src: getMediaUrl(asset.src),
  }));

  return Promise.all(
    proxiedAssets.map(async (asset) => {
      let durationInFrames: number;

      if (asset.type === 'video') {
        const metadata = await getVideoMetadata(asset.src);
        durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
      } else {
        durationInFrames = Math.ceil((asset.durationInSeconds ?? 3) * fps);
      }

      return {
        type: asset.type,
        src: asset.src,
        durationInFrames: Math.max(durationInFrames, MIN_DURATION_FRAMES),
      };
    })
  );
}

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    let mounted = true;

    const loadWithRetries = async () => {
      setLoadError(null);
      let lastError: unknown;

      for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        if (!mounted) return;

        try {
          if (attempt > 1) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            if (!mounted) return;
          }

          const mediaWithDurations = await calculateMediaDurations(FPS);
          if (!mounted) return;

          const totalFrames = mediaWithDurations.reduce(
            (sum, item) => sum + item.durationInFrames,
            0
          );

          setMedia(mediaWithDurations);
          setTotalDuration(totalFrames);
          return;
        } catch (err) {
          lastError = err;
          console.error(`Attempt ${attempt} failed:`, err);
        }
      }

      // All retries failed
      if (mounted) {
        console.error('All retry attempts failed:', lastError);
        setLoadError('Unable to load media. Please check your connection and try again.');
      }
    };

    loadWithRetries();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const containerStyle: React.CSSProperties = {
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
    boxSizing: 'border-box',
  };

  if (loadError) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ marginBottom: '1rem' }}>Unable to load</h2>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!totalDuration || !media) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ marginBottom: '2rem' }}>Loading media...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Player
          ref={playerRef}
          component={VideoSequence}
          durationInFrames={totalDuration}
          fps={FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: '100%',
            outline: 'none',
          }}
          controls
          autoPlay={false}
          initiallyMuted={isMobileOrTablet()}
          inputProps={{ media }}
        />
      </div>
    </div>
  );
};
