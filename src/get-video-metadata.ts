import { Input, ALL_FORMATS, UrlSource } from 'mediabunny';

export interface VideoMetadata {
  durationInSeconds: number;
  dimensions: {
    width: number;
    height: number;
  } | null;
  fps: number | null;
}

export const getVideoMetadata = async (src: string): Promise<VideoMetadata> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, {
      getRetryDelay: () => null,
    }),
  });

  const durationInSeconds = await input.computeDuration();
  const videoTrack = await input.getPrimaryVideoTrack();
  const dimensions = videoTrack
    ? {
        width: videoTrack.displayWidth,
        height: videoTrack.displayHeight,
      }
    : null;
  const packetStats = await videoTrack?.computePacketStats(50);
  const fps = packetStats?.averagePacketRate ?? null;

  input.dispose();

  return {
    durationInSeconds,
    dimensions,
    fps,
  };
};
