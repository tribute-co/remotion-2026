import { Composition } from 'remotion';
import { VideoSequence } from './VideoSequence';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoSequence"
        component={VideoSequence}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
