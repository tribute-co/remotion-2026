import { Player, PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { getMediaUrl } from './get-media-url';
import { getVideoMetadata } from './get-video-metadata';
import { mediaAssets } from './media-schema';
import { VideoSequence, MediaItem } from './VideoSequence';

/** Minimum duration per clip (avoids zero-length). */
const MIN_SEQUENCE_DURATION_FRAMES = 1;

/** Retry duration calculation this many times before giving up. */
const DURATION_RETRY_ATTEMPTS = 3;

/** Delay (ms) between retries. */
const DURATION_RETRY_DELAY_MS = 2000;

/** True on iOS, Android, or other touch-first devices; used to default to muted until user taps. */
function isMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android|webOS|Mobile|Tablet/i.test(ua) || 'ontouchstart' in window;
}

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const fps = 30;
  const playerRef = useRef<PlayerRef>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Start muted on mobile (Player's initiallyMuted). Sync Player mute state into composition so unmute actually plays audio on iOS.
  const initiallyMuted = typeof window !== 'undefined' && isMobileOrTablet();
  const [isMuted, setIsMuted] = useState(initiallyMuted);

  // Keep composition in sync with Player mute state (fixes iOS: bg music + video both follow mute button)
  useEffect(() => {
    if (!totalDuration) return;
    let cancelled = false;
    let removeListener: (() => void) | undefined;
    let retries = 0;
    const setup = () => {
      const player = playerRef.current;
      if (!player) {
        retries += 1;
        if (retries <= 50) setTimeout(setup, 0);
        return;
      }
      if (cancelled) return;
      const playerMuted = player.isMuted();
      const onMuteChange = (e: { detail: { isMuted: boolean } }) => {
        setIsMuted(e.detail.isMuted);
      };
      player.addEventListener('mutechange', onMuteChange);
      setIsMuted(playerMuted);
      removeListener = () => player.removeEventListener('mutechange', onMuteChange);
    };
    setup();
    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [totalDuration]);

  useEffect(() => {
    let mounted = true;
    const proxiedItems = mediaAssets.map((asset) => ({
      ...asset,
      src: getMediaUrl(asset.src),
    }));

    const calculateDurations = async (): Promise<MediaItem[]> => {
      const mediaWithDurations: MediaItem[] = await Promise.all(
        proxiedItems.map(async (asset) => {
          let durationInFrames: number;
          if (asset.type === 'video') {
            const metadata = await getVideoMetadata(asset.src);
            durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
          } else {
            durationInFrames = Math.ceil((asset.durationInSeconds ?? 3) * fps);
          }
          durationInFrames = Math.max(durationInFrames, MIN_SEQUENCE_DURATION_FRAMES);
          return {
            type: asset.type,
            src: asset.src,
            durationInFrames,
          };
        })
      );
      return mediaWithDurations;
    };

    const runWithRetries = async () => {
      setLoadError(null);

      let lastError: unknown;
      for (let attempt = 1; attempt <= DURATION_RETRY_ATTEMPTS; attempt++) {
        if (!mounted) return;
        try {
          if (attempt > 1) {
            await new Promise((r) => setTimeout(r, DURATION_RETRY_DELAY_MS));
            if (!mounted) return;
          }
          const mediaWithDurations = await calculateDurations();
          if (!mounted) return;
          const totalFrames = mediaWithDurations.reduce((sum, m) => sum + m.durationInFrames, 0);
          setMedia(mediaWithDurations);
          setTotalDuration(totalFrames);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      if (mounted) {
        console.error('All retries failed:', lastError);
        setLoadError(
          'Unable to load media. Please check your connection and try again.'
        );
        setMedia(null);
        setTotalDuration(null);
      }
    };

    runWithRetries();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const containerStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: '100dvh' as const,
    height: '100dvh' as const,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '2rem',
    boxSizing: 'border-box' as const,
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
            onClick={() => {
              setLoadError(null);
              setRetryCount((c) => c + 1);
            }}
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
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        <Player
          ref={playerRef}
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
          initiallyMuted={initiallyMuted}
          inputProps={{
            media,
            totalDurationInFrames: totalDuration,
            isMuted,
          }}
        />
      </div>
    </div>
  );
};
