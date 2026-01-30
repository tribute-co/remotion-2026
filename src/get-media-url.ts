/**
 * Rewrite CDN URLs to same-origin proxy to avoid CORS (Web Audio API needs it).
 * Dev: Vite proxy (photos-r2-proxy, encode-proxy, video-assets-proxy).
 * Production: Netlify proxies /api/videos/* to tribute-video-assets; photos/encode use direct URLs.
 */
export function getMediaUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  const origin = window.location.origin;
  if (url.startsWith('https://photos-r2.tribute.co/')) {
    if (import.meta.env.DEV)
      return `${origin}/photos-r2-proxy${url.slice('https://photos-r2.tribute.co'.length)}`;
    return url;
  }
  if (url.startsWith('https://tribute-production-encode.b-cdn.net/')) {
    if (import.meta.env.DEV)
      return `${origin}/encode-proxy${url.slice('https://tribute-production-encode.b-cdn.net'.length)}`;
    return url;
  }
  if (url.startsWith('https://tribute-video-assets.tribute.co/')) {
    // Dev: Vite proxy; production: Netlify proxy /api/videos/* -> tribute-video-assets
    const path = url.slice('https://tribute-video-assets.tribute.co'.length);
    return import.meta.env.DEV
      ? `${origin}/video-assets-proxy${path}`
      : `${origin}/api/videos${path}`;
  }
  return url;
}
