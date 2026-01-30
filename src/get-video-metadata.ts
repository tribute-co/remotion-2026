import { Input, ALL_FORMATS, UrlSource } from 'mediabunny';

export interface VideoMetadata {
  durationInSeconds: number;
  dimensions: {
    width: number;
    height: number;
  } | null;
  fps: number | null;
}

/**
 * Extracts metadata from a video file using mediabunny.
 * Returns duration, dimensions, and frame rate.
 */
export async function getVideoMetadata(src: string): Promise<VideoMetadata> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, {
      getRetryDelay: () => null,
    }),
  });

  try {
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

    return {
      durationInSeconds,
      dimensions,
      fps,
    };
  } finally {
    // Always dispose to free resources
    input.dispose();
  }
}
