import { CONFIG } from './config';

/**
 * Rewrites CDN URLs to same-origin proxy to avoid CORS issues.
 * Web Audio API requires same-origin for audio playback.
 *
 * Development: Uses Vite proxy
 * Production: Uses Netlify proxies
 */
export function getMediaUrl(url: string): string {
  if (typeof window === 'undefined') return url;

  const origin = window.location.origin;
  const isDev = import.meta.env.DEV;

  // Photos R2 CDN
  if (url.startsWith(CONFIG.CDN.PHOTOS_R2)) {
    if (isDev) {
      const path = url.slice(CONFIG.CDN.PHOTOS_R2.length);
      return `${origin}${CONFIG.PROXY.PHOTOS_R2}${path}`;
    }
    return url;
  }

  // Encode CDN
  if (url.startsWith(CONFIG.CDN.ENCODE)) {
    if (isDev) {
      const path = url.slice(CONFIG.CDN.ENCODE.length);
      return `${origin}${CONFIG.PROXY.ENCODE}${path}`;
    }
    return url;
  }

  return url;
}
