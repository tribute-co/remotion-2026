import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame, interpolate } from 'remotion';
import { Video } from '@remotion/media';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media?: MediaItem[];
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

// Calculate which media item is currently playing and return appropriate volume
const useAudioVolume = (media: MediaItem[]) => {
  const frame = useCurrentFrame();
  
  if (media.length === 0) return 0.25;
  
  let currentFrame = 0;
  
  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    const itemEnd = currentFrame + item.durationInFrames;
    
    if (frame >= currentFrame && frame < itemEnd) {
      const transitionDuration = 20; // frames for smooth volume transition (matches visual transition)
      const itemProgress = frame - currentFrame;
      const framesRemaining = itemEnd - frame;
      
      // Get target volume for current item
      const currentVolume = item.type === 'image' ? 1.0 : 0.25;
      
      // If we're at the END of the current item and there's a next item, start transitioning early
      if (framesRemaining <= transitionDuration && i < media.length - 1) {
        const nextVolume = media[i + 1].type === 'image' ? 1.0 : 0.25;
        return interpolate(
          framesRemaining,
          [0, transitionDuration],
          [nextVolume, currentVolume],
          { extrapolateRight: 'clamp' }
        );
      }
      
      return currentVolume;
    }
    
    currentFrame = itemEnd;
  }
  
  // Default to video volume if we're past all items
  return 0.25;
};

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media = [] }) => {
  const audioVolume = useAudioVolume(media);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background audio - volume ducks for videos (25%) and rises for images (100%) */}
      <Audio src={getAudioUrl()} volume={audioVolume} />
      
      <TransitionSeries>
        {media.map((item, index) => (
          <React.Fragment key={`media-${index}`}>
            <TransitionSeries.Sequence durationInFrames={item.durationInFrames}>
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
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </AbsoluteFill>
            </TransitionSeries.Sequence>
            {index < media.length - 1 && (
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
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
