import { Player, PlayerRef } from '@remotion/player';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from './config';
import { getMediaUrl } from './get-media-url';
import { getVideoMetadata } from './get-video-metadata';
import { Icon } from './icons/registry';
import { mediaAssets } from './media-schema';
import { VideoSequence, MediaItem } from './VideoSequence';

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
        durationInFrames = Math.ceil((asset.durationInSeconds ?? CONFIG.DEFAULT_IMAGE_DURATION_SECONDS) * fps);
      }

      return {
        type: asset.type,
        src: asset.src,
        durationInFrames: Math.max(durationInFrames, CONFIG.MIN_DURATION_FRAMES),
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

      for (let attempt = 1; attempt <= CONFIG.RETRY.ATTEMPTS; attempt++) {
        if (!mounted) return;

        try {
          if (attempt > 1) {
            await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY.DELAY_MS));
            if (!mounted) return;
          }

          const mediaWithDurations = await calculateMediaDurations(CONFIG.FPS);
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

  // Memoize inputProps to avoid unnecessary re-renders (best practice)
  const inputProps = useMemo(() => {
    return { media: media ?? [] };
  }, [media]);

  // Start frame of each asset (for skip prev/next)
  const assetStartFrames = useMemo(() => {
    if (!media) return [];
    const starts: number[] = [0];
    let acc = 0;
    for (let i = 0; i < media.length; i++) {
      acc += media[i].durationInFrames;
      starts.push(acc);
    }
    return starts;
  }, [media]);

  const skipToPreviousAsset = useCallback(() => {
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    let index = 0;
    for (let i = assetStartFrames.length - 1; i >= 0; i--) {
      if (frame >= assetStartFrames[i]) {
        index = i;
        break;
      }
    }
    const prevIndex = Math.max(0, index - 1);
    playerRef.current?.seekTo(assetStartFrames[prevIndex]);
  }, [assetStartFrames]);

  const skipToNextAsset = useCallback(() => {
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    let index = 0;
    for (let i = assetStartFrames.length - 1; i >= 0; i--) {
      if (frame >= assetStartFrames[i]) {
        index = i;
        break;
      }
    }
    const nextIndex = Math.min(assetStartFrames.length - 2, index + 1);
    playerRef.current?.seekTo(assetStartFrames[nextIndex]);
  }, [assetStartFrames]);

  const [currentFrame, setCurrentFrame] = useState(0);
  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const onFrameUpdate = () => setCurrentFrame(el.getCurrentFrame());
    el.addEventListener('frameupdate', onFrameUpdate);
    setCurrentFrame(el.getCurrentFrame());
    return () => el.removeEventListener('frameupdate', onFrameUpdate);
  }, [totalDuration, media]);
  const currentAssetIndex = (() => {
    if (!media?.length || !assetStartFrames.length) return 0;
    let index = 0;
    for (let i = assetStartFrames.length - 1; i >= 0; i--) {
      if (currentFrame >= assetStartFrames[i]) {
        index = Math.min(i, media.length - 1);
        break;
      }
    }
    return index;
  })();

  const canGoPrev = currentAssetIndex > 0;
  const canGoNext = media ? currentAssetIndex < media.length - 1 : false;

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
          component={VideoSequence as unknown as React.ComponentType<Record<string, unknown>>}
          durationInFrames={totalDuration}
          fps={CONFIG.FPS}
          compositionWidth={CONFIG.COMPOSITION.WIDTH}
          compositionHeight={CONFIG.COMPOSITION.HEIGHT}
          style={{
            width: '100%',
            height: '100%',
            outline: 'none',
          }}
          controls
          autoPlay={false}
          initiallyMuted={isMobileOrTablet()}
          inputProps={inputProps}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button
          type="button"
          aria-label="Previous asset"
          onClick={skipToPreviousAsset}
          disabled={!canGoPrev}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            background: canGoPrev ? '#333' : '#222',
            color: canGoPrev ? '#fff' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
          }}
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <span style={{ fontSize: '0.9rem', color: '#999' }}>
          {currentAssetIndex + 1} / {media.length}
        </span>
        <button
          type="button"
          aria-label="Next asset"
          onClick={skipToNextAsset}
          disabled={!canGoNext}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 1rem',
            background: canGoNext ? '#333' : '#222',
            color: canGoNext ? '#fff' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
          }}
        >
          <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </div>
  );
};
