import { useRef } from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  useCurrentFrame,
} from 'remotion';
import { Video } from '@remotion/media';

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
  /** When true, composition videos are muted. Synced from Player so unmute works on iOS. */
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
        <Video
          src={item.src}
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
  }

  return null;
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  media = [],
  totalDurationInFrames,
  isMuted = true,
}) => {
  const totalFrames =
    totalDurationInFrames ?? media.reduce((sum, m) => sum + m.durationInFrames, 0);

  // Media segments back-to-back (hard cuts, no transition gaps)
  const segments: MediaSegment[] = [];
  let offset = 0;
  for (const item of media) {
    segments.push({ type: item.type, fromFrame: offset, toFrame: offset + item.durationInFrames });
    offset += item.durationInFrames;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <SlideChangeLogger segments={segments} />
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
