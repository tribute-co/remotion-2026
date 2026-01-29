import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Video } from '@remotion/media';
import { AudioAsset, backgroundAudioTracks } from './media-schema';

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
  /** Composition frame where this audio Sequence started; useCurrentFrame() inside Sequence is relative. */
  sequenceFromFrame,
}: {
  track: AudioAsset;
  segments: MediaSegment[];
  sequenceFromFrame: number;
}) {
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

  return <Audio src={track.src} volume={volume * (track.volume ?? 1)} />;
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media = [], totalDurationInFrames }) => {
  const { fps } = useVideoConfig();
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
      {/* Background audio: sequential tracks, repeat to fill, volume duck by media type */}
      {audioSegments.map((seg, i) => (
        <Sequence key={i} from={seg.fromFrame} durationInFrames={seg.durationInFrames}>
          <BackgroundAudioWithDucking
            track={backgroundAudioTracks[seg.trackIndex]}
            segments={segments}
            sequenceFromFrame={seg.fromFrame}
          />
        </Sequence>
      ))}

      {/* Hard cuts: one Sequence per media item, back-to-back */}
      {media.map((item, index) => {
        const fromFrame = media
          .slice(0, index)
          .reduce((sum, m) => sum + m.durationInFrames, 0);
        return (
          <Sequence
            key={`${item.type}-${item.src}-${index}`}
            from={fromFrame}
            durationInFrames={item.durationInFrames}
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
