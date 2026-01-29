import { Player } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { preloadAudio, preloadImage, preloadVideo } from '@remotion/preload';
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

/** Minimum duration per clip (avoids zero-length). */
const MIN_SEQUENCE_DURATION_FRAMES = 1;

const LOADING_PHASES = [
  'Getting video durations…',
  'Preloading assets…',
  'Premounting videos…',
  'Applying background music…',
] as const;

/** Option 4: Preload (browser hint only, no full download). Fire-and-forget. */
function startPreloading(media: MediaItem[]) {
  const proxiedTracks = backgroundAudioTracks.map((t) => ({
    ...t,
    src: getMediaUrl(t.src),
  }));
  proxiedTracks.forEach((track) => preloadAudio(track.src));

  media.forEach((item) => {
    if (item.type === 'video') {
      preloadVideo(item.src);
    } else {
      preloadImage(item.src);
    }
  });
}

const PHASE_INTERVAL_MS = 450;

export const PlayerDemo: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [metadataReady, setMetadataReady] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>(LOADING_PHASES[0]);
  const phaseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fps = 30;

  useEffect(() => {
    let mounted = true;
    const proxiedItems = mediaAssets.map((asset) => ({
      ...asset,
      src: getMediaUrl(asset.src),
    }));

    const loadMetadataAndShowPlayer = async () => {
      try {
        setLoadingPhase(LOADING_PHASES[0]);

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

        // Run through remaining phases in quick sequence so user sees what we're doing
        setLoadingPhase(LOADING_PHASES[1]);
        startPreloading(mediaWithDurations);

        phaseTimeoutsRef.current = [
          setTimeout(() => {
            if (!mounted) return;
            setLoadingPhase(LOADING_PHASES[2]);
          }, PHASE_INTERVAL_MS),
          setTimeout(() => {
            if (!mounted) return;
            setLoadingPhase(LOADING_PHASES[3]);
          }, PHASE_INTERVAL_MS * 2),
          setTimeout(() => {
            if (!mounted) return;
            setMetadataReady(true);
          }, PHASE_INTERVAL_MS * 3),
        ];
      } catch (error) {
        console.error('Error loading media metadata:', error);
        if (mounted) {
          setMetadataReady(true);
          setTotalDuration(900);
        }
      }
    };

    loadMetadataAndShowPlayer();

    return () => {
      mounted = false;
      phaseTimeoutsRef.current.forEach(clearTimeout);
      phaseTimeoutsRef.current = [];
    };
  }, []);

  if (!totalDuration || !media || !metadataReady) {
    return (
      <div
        style={{
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
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ marginBottom: '2rem' }}>Loading…</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        height: '100dvh',
        backgroundColor: '#1a1a1a',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
      }}
    >
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
          inputProps={{ media, totalDurationInFrames: totalDuration }}
        />
      </div>
    </div>
  );
};
