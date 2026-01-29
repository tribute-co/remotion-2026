import { Fragment } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Video } from '@remotion/media';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AudioAsset, backgroundAudioTracks } from './media-schema';

/** Must match TransitionSeries.Transition timing; used for segment boundaries and total duration. */
export const TRANSITION_DURATION_FRAMES = 10;

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
}

export interface VideoSequenceProps {
  media?: MediaItem[];
  totalDurationInFrames?: number;
}

type MediaSegment = { type: 'video' | 'image'; fromFrame: number; toFrame: number };

/** Background audio volume ducking based on current media segment (image = full, video = ducked). */
function BackgroundAudioWithDucking({
  track,
  segments,
}: {
  track: AudioAsset;
  segments: MediaSegment[];
}) {
  const frame = useCurrentFrame();
  const transitionDuration = 15;

  let volume = 0.15; // default ducked
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (frame < seg.fromFrame) break;
    if (frame <= seg.toFrame) {
      const targetVolume = seg.type === 'image' ? 1.0 : 0.15;
      const nextSeg = segments[i + 1];
      if (nextSeg && frame > seg.toFrame - transitionDuration) {
        const nextVolume = nextSeg.type === 'image' ? 1.0 : 0.15;
        volume = interpolate(
          frame,
          [seg.toFrame - transitionDuration, seg.toFrame],
          [targetVolume, nextVolume],
          { extrapolateRight: 'clamp' }
        );
      } else {
        volume = targetVolume;
      }
      break;
    }
  }

  return <Audio src={track.src} volume={volume * (track.volume ?? 1)} />;
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media = [], totalDurationInFrames }) => {
  const { fps } = useVideoConfig();
  const totalFrames =
    totalDurationInFrames ??
    media.reduce((sum, m) => sum + m.durationInFrames, 0) + (media.length - 1) * TRANSITION_DURATION_FRAMES;

  // Media segments with global from/to for volume ducking (match TransitionSeries: each segment after a 10-frame transition)
  const segments: MediaSegment[] = [];
  let offset = 0;
  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    segments.push({ type: item.type, fromFrame: offset, toFrame: offset + item.durationInFrames });
    offset += item.durationInFrames + TRANSITION_DURATION_FRAMES;
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
      {/* Background audio: sequential tracks, repeat to fill, volume duck by media type */}
      {audioSegments.map((seg, i) => (
        <Sequence key={i} from={seg.fromFrame} durationInFrames={seg.durationInFrames}>
          <BackgroundAudioWithDucking track={backgroundAudioTracks[seg.trackIndex]} segments={segments} />
        </Sequence>
      ))}

      <TransitionSeries>
        {media.map((item, index) => (
          <Fragment key={`${item.type}-${item.src}-${index}`}>
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
                timing={linearTiming({ durationInFrames: TRANSITION_DURATION_FRAMES })}
                presentation={fade()}
              />
            )}
          </Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
