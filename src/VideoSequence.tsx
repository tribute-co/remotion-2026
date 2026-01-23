import { AbsoluteFill, Audio } from 'remotion';
import { Video } from '@remotion/media';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

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
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background audio - plays in sync with video */}
      <Audio src={getAudioUrl()} volume={0.5} />
      
      <TransitionSeries>
        {videos.map((video, index) => (
          <>
            <TransitionSeries.Sequence durationInFrames={video.durationInFrames} key={`video-${index}`}>
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
            </TransitionSeries.Sequence>
            {index < videos.length - 1 && (
              <TransitionSeries.Transition
                key={`transition-${index}`}
                timing={springTiming({
                  config: {
                    damping: 200,
                  },
                })}
                presentation={fade()}
              />
            )}
          </>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
