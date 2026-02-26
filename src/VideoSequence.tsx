import { AbsoluteFill, Img, Sequence, useVideoConfig } from 'remotion';
import { Audio, Video } from '@remotion/media';
import { useMemo } from 'react';
import { CONFIG } from './config';
import { backgroundAudioPlaylist } from './media-schema';

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  durationInFrames: number;
  /** Trim from start (frames); used with Remotion Video trimBefore */
  trimBeforeFrames?: number;
  /** Trim from end (frames); used with Remotion Video trimAfter */
  trimAfterFrames?: number;
  /** Video-only: volume (0–1 or >1 for boost). Omit = 1. */
  volume?: number;
}

export interface VideoSequenceProps {
  media: MediaItem[];
}

/** Expand playlist into segments (from, durationInFrames, src) covering totalDurationFrames; repeats sequence as needed */
function expandBgPlaylist(
  totalDurationFrames: number,
  fps: number
): { from: number; durationInFrames: number; src: string }[] {
  const tracks = backgroundAudioPlaylist.filter((t) => t.src.trim() !== '');
  if (tracks.length === 0) return [];

  const segmentDurationsFrames = tracks.map((t) =>
    Math.ceil(
      (t.durationInSeconds ?? CONFIG.DEFAULT_BG_AUDIO_TRACK_DURATION_SECONDS) *
        fps
    )
  );
  const playlistDurationFrames = segmentDurationsFrames.reduce((a, b) => a + b, 0);
  if (playlistDurationFrames <= 0) return [];

  const segments: { from: number; durationInFrames: number; src: string }[] = [];
  let currentFrame = 0;

  while (currentFrame < totalDurationFrames) {
    for (let i = 0; i < tracks.length; i++) {
      if (currentFrame >= totalDurationFrames) break;
      const durationInFrames = segmentDurationsFrames[i];
      segments.push({
        from: currentFrame,
        durationInFrames,
        src: tracks[i].src,
      });
      currentFrame += durationInFrames;
    }
  }

  return segments;
}

export const VideoSequence: React.FC<VideoSequenceProps> = ({ media }) => {
  const { durationInFrames: totalDurationFrames, fps } = useVideoConfig();
  const bgSegments = useMemo(
    () => expandBgPlaylist(totalDurationFrames, fps),
    [totalDurationFrames, fps]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {bgSegments.map((seg, i) => (
        <Sequence
          key={`bg-${i}-${seg.from}`}
          from={seg.from}
          durationInFrames={seg.durationInFrames}
        >
          <Audio src={seg.src} volume={CONFIG.BG_AUDIO_VOLUME} />
        </Sequence>
      ))}
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
                  trimBefore={item.trimBeforeFrames}
                  trimAfter={item.trimAfterFrames}
                  volume={item.volume ?? 1}
                  {...(item.volume !== undefined && item.volume > 1
                    ? { useWebAudioApi: true as const, crossOrigin: 'anonymous' as const }
                    : {})}
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
