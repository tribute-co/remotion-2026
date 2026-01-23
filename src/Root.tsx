import { Composition } from 'remotion';
import { VideoSequence, VideoWithDuration } from './VideoSequence';
import { getVideoMetadata } from './get-video-metadata';

const videoUrls = [
  'https://tribute-video-assets.tribute.co/sloth_on_train.mp4',
  'https://tribute-video-assets.tribute.co/mongolian_horses_4k.mp4',
  'https://tribute-video-assets.tribute.co/magical_ink.mp4',
];

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
          videos: [] as VideoWithDuration[],
        }}
        calculateMetadata={async ({ fps }) => {
          const metadataPromises = videoUrls.map(url => getVideoMetadata(url));
          const allMetadata = await Promise.all(metadataPromises);
          
          const videosWithDurations = videoUrls.map((src, index) => {
            const metadata = allMetadata[index];
            const durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
            return {
              src,
              durationInFrames,
            };
          });

          const totalFrames = videosWithDurations.reduce((sum, v) => sum + v.durationInFrames, 0);
          
          return {
            durationInFrames: totalFrames,
            props: {
              videos: videosWithDurations,
            },
          };
        }}
      />
    </>
  );
};
