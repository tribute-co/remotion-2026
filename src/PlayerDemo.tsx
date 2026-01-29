import { Player } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { prefetch } from 'remotion';
import { VideoSequence, MediaItem } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';
import { log } from './logger';
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

/** Minimum duration per clip (avoids zero-length). */
const MIN_SEQUENCE_DURATION_FRAMES = 1;

/** Only prefetch this many media items initially to avoid iOS memory crash; rest load progressively. */
const INITIAL_PREFETCH_COUNT = 5;

/** Prefetch items that start within this many seconds of current playhead. */
const PREFETCH_AHEAD_SECONDS = 60;

/** Interval (ms) to check playhead and prefetch more. */
const PREFETCH_POLL_INTERVAL_MS = 5000;

/** Max items to prefetch per interval tick; when user seeks far ahead we spread work over multiple ticks instead of bursting. */
const MAX_PROGRESSIVE_PREFETCH_PER_TICK = 5;

/** True on iOS, Android, or other touch-first devices; used to default to muted until user taps. */
function isMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android|webOS|Mobile|Tablet/i.test(ua) || 'ontouchstart' in window;
}

type PlayerRef = { getCurrentFrame: () => number } | null;

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{[key: number]: number}>({});
  const [allPrefetched, setAllPrefetched] = useState(false);
  const [startedLoading, setStartedLoading] = useState(false);
  const fps = 30;
  const playerRef = useRef<PlayerRef>(null);
  const nextPrefetchIndexRef = useRef(INITIAL_PREFETCH_COUNT);
  // Default muted on mobile so one tap unmutes both video and bg music (iOS autoplay policy)
  const [isMuted, setIsMuted] = useState(
    () => typeof window !== 'undefined' && isMobileOrTablet()
  );

  useEffect(() => {
    let mounted = true;
    const proxiedItems = mediaAssets.map((asset) => ({
      ...asset,
      src: getMediaUrl(asset.src),
    }));

    // Runs on mount; can run again if component remounts (e.g. HMR in dev, or parent key change)
    const calculateDurationsAndPrefetch = async () => {
      try {
        setStartedLoading(true);
        log.prefetchOnce('start', 'Starting: computing durations for all media');

        // Process all media assets (we need durations for the full timeline)
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

        if (!mounted) return;

        const totalFrames = mediaWithDurations.reduce((sum, m) => sum + m.durationInFrames, 0);
        setMedia(mediaWithDurations);
        setTotalDuration(totalFrames);

        const initialCount = Math.min(INITIAL_PREFETCH_COUNT, mediaWithDurations.length);
        log.prefetchOnce(
          'initial',
          `Initial prefetch: first ${initialCount} media + ${backgroundAudioTracks.length} audio tracks (blob-url)`
        );
        for (let index = 0; index < initialCount; index++) {
          setLoadingProgress((prev) => ({ ...prev, [index]: 0 }));
        }

        // Prefetch only first N media items + all background audio (reduces memory on iOS)
        const audioPrefetches = backgroundAudioTracks.map((track) =>
          prefetch(track.src, { method: 'blob-url' })
        );
        const initialMediaPrefetches = mediaWithDurations.slice(0, initialCount).map((item, index) => {
          const { waitUntilDone } = prefetch(item.src, {
            method: 'blob-url',
            onProgress: (progress) => {
              if (mounted && progress.totalBytes) {
                const percent = Math.round((progress.loadedBytes / progress.totalBytes) * 100);
                if (!isNaN(percent)) {
                  setLoadingProgress((prev) => ({ ...prev, [index]: percent }));
                }
              }
            },
          });
          return waitUntilDone();
        });

        await Promise.all([
          ...initialMediaPrefetches,
          ...audioPrefetches.map((p) => p.waitUntilDone()),
        ]);

        if (mounted) {
          log.prefetchOnce('initial-done', 'Initial prefetch complete');
          for (let index = 0; index < initialCount; index++) {
            setLoadingProgress((prev) => ({ ...prev, [index]: 100 }));
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
          setAllPrefetched(true);
          log.prefetchOnce('player-ready', 'Player ready (initial prefetch done)');
        }
      } catch (error) {
        console.error('Error loading media:', error);
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

  // Progressively prefetch more media as playback advances (keeps memory lower on mobile)
  useEffect(() => {
    if (!media || !allPrefetched || media.length <= INITIAL_PREFETCH_COUNT) return;

    const aheadFrames = PREFETCH_AHEAD_SECONDS * fps;
    const startFrames: number[] = [];
    let offset = 0;
    for (const item of media) {
      startFrames.push(offset);
      offset += item.durationInFrames;
    }

    const prefetchUpcoming = () => {
      const nextIndex = nextPrefetchIndexRef.current;
      if (nextIndex >= media.length) return;

      const player = playerRef.current;
      const currentFrame =
        typeof player?.getCurrentFrame === 'function' ? player.getCurrentFrame() : null;

      if (currentFrame === null) {
        // Player not mounted yet: prefetch only the next one to avoid memory spike
        log.prefetch('Progressive prefetch (no playhead yet): item', nextIndex);
        prefetch(media[nextIndex].src, { method: 'blob-url' });
        nextPrefetchIndexRef.current = nextIndex + 1;
        return;
      }

      let prefetchedThisTick = 0;
      for (let i = nextIndex; i < media.length && prefetchedThisTick < MAX_PROGRESSIVE_PREFETCH_PER_TICK; i++) {
        if (startFrames[i] <= currentFrame + aheadFrames) {
          log.prefetch('Progressive prefetch: item', i, `(frame ${currentFrame}, start ${startFrames[i]})`);
          prefetch(media[i].src, { method: 'blob-url' });
          nextPrefetchIndexRef.current = i + 1;
          prefetchedThisTick++;
        } else {
          break;
        }
      }
    };

    prefetchUpcoming();
    const interval = setInterval(prefetchUpcoming, PREFETCH_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [media, allPrefetched, fps]);

  if (!totalDuration || !media || !allPrefetched) {
    const loadingCount = Math.min(INITIAL_PREFETCH_COUNT, media?.length ?? mediaAssets.length);
    const overallProgress =
      loadingCount > 0 && Object.keys(loadingProgress).length > 0
        ? Math.round(
            Object.values(loadingProgress).reduce((a, b) => a + b, 0) / loadingCount
          )
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
        onClick={() => {
          if (isMuted) {
            log.player('Unmuted (user tap)');
            setIsMuted(false);
          }
        }}
        role={isMuted ? 'button' : undefined}
        tabIndex={isMuted ? 0 : undefined}
        onKeyDown={(e) => {
          if (isMuted && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            log.player('Unmuted (keyboard)');
            setIsMuted(false);
          }
        }}
        aria-label={isMuted ? 'Tap to unmute' : undefined}
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
          inputProps={{
            media,
            totalDurationInFrames: totalDuration,
            isMuted,
          }}
        />
        {isMuted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 500,
              pointerEvents: 'none',
              borderRadius: '12px',
            }}
          >
            Tap to unmute
          </div>
        )}
      </div>
    </div>
  );
};
