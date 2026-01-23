import { AbsoluteFill, Sequence, Audio } from 'remotion';
import { Video } from '@remotion/media';

export interface VideoWithDuration {
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  videos: VideoWithDuration[];
}

// Get background audio URL (use proxy in production)
const getAudioUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://tribute-video-assets.tribute.co/EVOE%20-%20Pearl.mp3';
  }
  
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    return '/api/videos/EVOE%20-%20Pearl.mp3';
  }
  
  return 'https://tribute-video-assets.tribute.co/EVOE%20-%20Pearl.mp3';
};

export const VideoSequence: React.FC<VideoSequenceProps> = ({ videos }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background audio - plays in sync with video */}
      <Audio src={getAudioUrl()} volume={0.5} />
      
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
