/**
 * In dev, rewrite CDN URLs to same-origin proxy to avoid CORS.
 * Production uses direct URLs.
 */
export function getMediaUrl(url: string): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (url.startsWith('https://photos-r2.tribute.co/'))
      return `${origin}/photos-r2-proxy${url.slice('https://photos-r2.tribute.co'.length)}`;
    if (url.startsWith('https://tribute-production-encode.b-cdn.net/'))
      return `${origin}/encode-proxy${url.slice('https://tribute-production-encode.b-cdn.net'.length)}`;
    if (url.startsWith('https://tribute-video-assets.tribute.co/'))
      return `${origin}/video-assets-proxy${url.slice('https://tribute-video-assets.tribute.co'.length)}`;
  }
  return url;
}
