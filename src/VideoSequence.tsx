import { useEffect, useRef } from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Html5Video,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { getMediaUrl } from './get-media-url';
import { AudioAsset, backgroundAudioTracks } from './media-schema';

/** Premount sequences this many frames before they start (gives time to load before visible). */
const PREMOUNT_FRAMES = 30; // 1 second at 30fps

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media?: MediaItem[];
  totalDurationInFrames?: number;
  /** When true, composition audio/video are muted. Synced from Player so unmute works on iOS. */
  isMuted?: boolean;
}

type MediaSegment = { type: 'video' | 'image'; fromFrame: number; toFrame: number };

/** Media component that mounts early (for loading) but only visible during its window. */
function PremountedMedia({
  item,
  premountOffset,
  isMuted,
}: {
  item: MediaItem;
  premountOffset: number;
  isMuted: boolean;
}) {
  const frame = useCurrentFrame();
  const isPremount = frame < premountOffset;
  return (
    <AbsoluteFill style={{ opacity: isPremount ? 0 : 1, pointerEvents: isPremount ? 'none' : 'auto' }}>
      {item.type === 'video' ? (
        <Html5Video
          src={item.src}
          pauseWhenBuffering
          muted={isMuted}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <Img
          src={item.src}
          pauseWhenLoading
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </AbsoluteFill>
  );
}

/** Logs when the current media segment (slide) changes. */
function SlideChangeLogger({ segments }: { segments: MediaSegment[] }) {
  const frame = useCurrentFrame();
  const lastIndexRef = useRef<number | null>(null);

  let currentIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (frame >= segments[i].fromFrame && frame < segments[i].toFrame) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex !== -1 && lastIndexRef.current !== currentIndex) {
    lastIndexRef.current = currentIndex;
    const seg = segments[currentIndex];
    console.log(
      '[Remotion] [slide] Segment %s/%s: %s (frames %s–%s)',
      currentIndex + 1,
      segments.length,
      seg.type,
      seg.fromFrame,
      seg.toFrame
    );
  }

  return null;
}

/** Background audio volume ducking based on current media segment (image = full, video = ducked). */
function BackgroundAudioWithDucking({
  track,
  segments,
  sequenceFromFrame,
  isMuted,
}: {
  track: AudioAsset;
  segments: MediaSegment[];
  sequenceFromFrame: number;
  isMuted: boolean;
}) {
  const prevMutedRef = useRef<boolean | undefined>(undefined);
  if (prevMutedRef.current !== isMuted) {
    console.log('[Remotion] [mute] bg audio muted=%s (track: %s)', isMuted, track.src.split('/').pop() ?? track.src);
    prevMutedRef.current = isMuted;
  }
  const relativeFrame = useCurrentFrame();
  const frame = sequenceFromFrame + relativeFrame; // composition frame for correct segment lookup
  const crossfadeFrames = 10;

  let volume = 0.15; // default ducked
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    if (frame >= seg.fromFrame && frame < seg.toFrame) {
      const targetVolume = seg.type === 'image' ? 1.0 : 0.15;
      if (nextSeg && frame > seg.toFrame - crossfadeFrames) {
        const nextVolume = nextSeg.type === 'image' ? 1.0 : 0.15;
        volume = interpolate(
          frame,
          [seg.toFrame - crossfadeFrames, seg.toFrame],
          [targetVolume, nextVolume],
          { extrapolateRight: 'clamp' }
        );
      } else {
        volume = targetVolume;
      }
      break;
    }
  }

  // When muted, force volume to 0 so bg stays silent on iOS (muted prop can apply late with useWebAudioApi)
  const effectiveVolume = isMuted ? 0 : volume * (track.volume ?? 1);
  return (
    <Html5Audio
      src={getMediaUrl(track.src)}
      volume={effectiveVolume}
      useWebAudioApi
      pauseWhenBuffering
      muted={isMuted}
    />
  );
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  media = [],
  totalDurationInFrames,
  isMuted = true, // default muted so bg music muted on first frame until Player syncs
}) => {
  const { fps } = useVideoConfig();
  const prevMutedRef = useRef<boolean | null>(null);
  const didLogFirstRef = useRef(false);
  useEffect(() => {
    if (!didLogFirstRef.current) {
      console.log('[Remotion] [mute] composition first render: isMuted=%s', isMuted);
      didLogFirstRef.current = true;
    }
    if (prevMutedRef.current !== isMuted) {
      console.log('[Remotion] [mute] composition isMuted=%s (prev=%s)', isMuted, prevMutedRef.current);
      prevMutedRef.current = isMuted;
    }
  }, [isMuted]);

  const totalFrames =
    totalDurationInFrames ?? media.reduce((sum, m) => sum + m.durationInFrames, 0);

  // Media segments back-to-back (hard cuts, no transition gaps)
  const segments: MediaSegment[] = [];
  let offset = 0;
  for (const item of media) {
    segments.push({ type: item.type, fromFrame: offset, toFrame: offset + item.durationInFrames });
    offset += item.durationInFrames;
  }

  // Background audio: play tracks in order, repeat to fill composition
  const trackDurationsFrames = backgroundAudioTracks.map((t) => Math.ceil(t.durationInSeconds * fps));
  const audioSegments: { trackIndex: number; fromFrame: number; durationInFrames: number }[] = [];
  let frame = 0;
  let trackIndex = 0;
  while (frame < totalFrames) {
    const durationInFrames = trackDurationsFrames[trackIndex % backgroundAudioTracks.length];
    const duration = Math.min(durationInFrames, totalFrames - frame);
    audioSegments.push({ trackIndex: trackIndex % backgroundAudioTracks.length, fromFrame: frame, durationInFrames: duration });
    frame += duration;
    trackIndex++;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <SlideChangeLogger segments={segments} />
      {/* Background audio: sequential tracks, repeat to fill, volume duck by media type */}
      {audioSegments.map((seg, i) => (
        <Sequence
          key={i}
          from={Math.max(0, seg.fromFrame - PREMOUNT_FRAMES)}
          durationInFrames={seg.durationInFrames + PREMOUNT_FRAMES}
        >
          <BackgroundAudioWithDucking
            track={backgroundAudioTracks[seg.trackIndex]}
            segments={segments}
            sequenceFromFrame={seg.fromFrame}
            isMuted={isMuted}
          />
        </Sequence>
      ))}

      {/* Hard cuts: one Sequence per media item, back-to-back, premounted */}
      {media.map((item, index) => {
        const fromFrame = media
          .slice(0, index)
          .reduce((sum, m) => sum + m.durationInFrames, 0);
        const premountFrom = Math.max(0, fromFrame - PREMOUNT_FRAMES);
        const premountOffset = fromFrame - premountFrom; // frames before actual start
        return (
          <Sequence
            key={`${item.type}-${item.src}-${index}`}
            from={premountFrom}
            durationInFrames={item.durationInFrames + premountOffset}
          >
            <PremountedMedia
              item={item}
              premountOffset={premountOffset}
              isMuted={isMuted}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
