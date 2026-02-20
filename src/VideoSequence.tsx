import { AbsoluteFill, Img, Sequence } from 'remotion';
import { Audio, Video } from '@remotion/media';
import { CONFIG } from './config';

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media: MediaItem[];
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Audio src={CONFIG.BACKGROUND_AUDIO_URL} loop volume={0.15} />
      {media.map((item, index) => {
        // Calculate when this item starts in the overall sequence
        const startFrame = media
          .slice(0, index)
          .reduce((sum, m) => sum + m.durationInFrames, 0);

        return (
          <Sequence
            key={`${item.type}-${index}-${item.src.slice(-20)}`}
            from={startFrame}
            durationInFrames={item.durationInFrames}
            premountFor={CONFIG.PREMOUNT_FRAMES}
          >
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
      })}
    </AbsoluteFill>
  );
};
