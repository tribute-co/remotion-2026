/**
 * Application configuration constants
 */

export const CONFIG = {
  /** Frames per second for video composition */
  FPS: 30,

  /** Video composition dimensions */
  COMPOSITION: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },

  /** Minimum duration for any media item (prevents zero-length sequences) */
  MIN_DURATION_FRAMES: 1,

  /** Default duration for images when not specified */
  DEFAULT_IMAGE_DURATION_SECONDS: 3,

  /** Default duration for a bg audio track when not specified (seconds) */
  DEFAULT_BG_AUDIO_TRACK_DURATION_SECONDS: 60,

  /** Background music volume (0–1); 0.075 = 7.5% */
  BG_AUDIO_VOLUME: 0.075,

  /** Number of frames to premount sequences before they become visible (for preloading) */
  PREMOUNT_FRAMES: 30,

  /** Retry configuration for loading media metadata */
  RETRY: {
    ATTEMPTS: 3,
    DELAY_MS: 2000,
  },

  /** CDN and proxy configuration */
  CDN: {
    PHOTOS_R2: 'https://photos-r2.tribute.co',
    ENCODE: 'https://tribute-production-encode.b-cdn.net',
  },

  /** Proxy paths (dev uses Vite proxy, production uses Netlify proxy) */
  PROXY: {
    PHOTOS_R2: '/photos-r2-proxy',
    ENCODE: '/encode-proxy',
  },
} as const;
