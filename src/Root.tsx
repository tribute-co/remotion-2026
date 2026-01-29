import { Composition } from 'remotion';
import { VideoSequence, MediaItem, VideoSequenceProps } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';
import { mediaAssets } from './media-schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoSequence"
        component={VideoSequence}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          media: [] as MediaItem[],
        }}
        calculateMetadata={async ({ props, defaultProps }) => {
          const fps = 30;
          // Process all media assets
          const mediaWithDurations: MediaItem[] = await Promise.all(
            mediaAssets.map(async (asset) => {
              if (asset.type === 'video') {
                const metadata = await getVideoMetadata(asset.src);
                const durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
                return {
                  type: 'video' as const,
                  src: asset.src,
                  durationInFrames,
                };
              } else {
                // For images, use the specified duration
                const durationInFrames = Math.ceil((asset.durationInSeconds || 3) * fps);
                return {
                  type: 'image' as const,
                  src: asset.src,
                  durationInFrames,
                };
              }
            })
          );

          const totalFrames = mediaWithDurations.reduce((sum, m) => sum + m.durationInFrames, 0);

          return {
            durationInFrames: totalFrames,
            props: {
              media: mediaWithDurations,
              totalDurationInFrames: totalFrames,
            },
          };
        }}
      />
    </>
  );
};
