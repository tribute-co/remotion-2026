import { AbsoluteFill, Sequence } from 'remotion';
import { Video } from '@remotion/media';

export interface VideoWithDuration {
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  videos: VideoWithDuration[];
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ videos }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {videos.map((video, index) => {
        const from = currentFrame;
        currentFrame += video.durationInFrames;

        return (
          <Sequence key={index} from={from} durationInFrames={video.durationInFrames}>
            <AbsoluteFill>
              <Video
                src={video.src}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                pauseWhenBuffering
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
