import { Fragment } from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame, interpolate } from 'remotion';
import { Video } from '@remotion/media';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { backgroundAudioTracks } from './media-schema';

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media?: MediaItem[];
}

// Audio component that adjusts volume based on media type; plays all background tracks
const MediaAudio: React.FC<{ type: 'video' | 'image'; nextType?: 'video' | 'image'; durationInFrames: number }> = ({
  type,
  nextType,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const targetVolume = type === 'image' ? 1.0 : 0.25;

  const transitionDuration = 15;
  let volume: number;
  if (nextType && frame > durationInFrames - transitionDuration) {
    const nextVolume = nextType === 'image' ? 1.0 : 0.25;
    volume = interpolate(
      frame,
      [durationInFrames - transitionDuration, durationInFrames],
      [targetVolume, nextVolume],
      { extrapolateRight: 'clamp' }
    );
  } else {
    volume = targetVolume;
  }

  return (
    <>
      {backgroundAudioTracks.map((track, i) => (
        <Audio key={i} src={track.src} volume={volume * (track.volume ?? 1)} />
      ))}
    </>
  );
};

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media = [] }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      
      <TransitionSeries>
        {media.map((item, index) => (
          <Fragment key={`${item.type}-${item.src}-${index}`}>
            <TransitionSeries.Sequence durationInFrames={item.durationInFrames}>
              <AbsoluteFill>
                {/* Audio with volume based on current media type */}
                <MediaAudio 
                  type={item.type} 
                  nextType={index < media.length - 1 ? media[index + 1].type : undefined}
                  durationInFrames={item.durationInFrames}
                />
                
                {item.type === 'video' ? (
                  <Video
                    src={item.src}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Img
                    src={item.src}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
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
          </Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
