import { AbsoluteFill, Img, Sequence } from 'remotion';
import { Video } from '@remotion/media';

/** Premount sequences this many frames before they start to allow preloading */
const PREMOUNT_FRAMES = 30; // 1 second at 30fps

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media: MediaItem[];
}

interface PremountedMediaProps {
  item: MediaItem;
  premountOffset: number;
}

/**
 * Media component that mounts early for loading but only becomes visible
 * when its actual sequence time begins
 */
function PremountedMedia({ item, premountOffset }: PremountedMediaProps) {
  return (
    <Sequence from={premountOffset}>
      <AbsoluteFill>
        {item.type === 'video' ? (
          <Video
            src={item.src}
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
    </Sequence>
  );
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {media.map((item, index) => {
        // Calculate when this item starts in the overall sequence
        const startFrame = media
          .slice(0, index)
          .reduce((sum, m) => sum + m.durationInFrames, 0);

        // Mount early to allow preloading
        const premountStart = Math.max(0, startFrame - PREMOUNT_FRAMES);
        const premountOffset = startFrame - premountStart;

        return (
          <Sequence
            key={`${item.type}-${index}-${item.src.slice(-20)}`}
            from={premountStart}
            durationInFrames={item.durationInFrames + premountOffset}
          >
            <PremountedMedia item={item} premountOffset={premountOffset} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
