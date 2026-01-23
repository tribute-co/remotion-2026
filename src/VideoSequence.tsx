import { AbsoluteFill, Sequence, Video, staticFile } from 'remotion';

const videos = [
  {
    src: 'https://tribute-video-assets.tribute.co/sloth_on_train.mp4',
    durationInFrames: 300, // ~10 seconds at 30fps
  },
  {
    src: 'https://tribute-video-assets.tribute.co/mongolian_horses_4k.mp4',
    durationInFrames: 300,
  },
  {
    src: 'https://tribute-video-assets.tribute.co/magical_ink.mp4',
    durationInFrames: 300,
  },
];

export const VideoSequence: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
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
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
