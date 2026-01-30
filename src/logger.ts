/**
 * Basic app logging. Logs when:
 * - DEV, or REMOTION_DEBUG=1 at build time, or
 * - URL has ?remotion_debug=1 (so you can debug on device without rebuilding).
 * Use for prefetch, slide changes, mute state, etc.
 * Dedupe keys avoid duplicate logs from React Strict Mode (double-invoke) or multiple instances.
 */
function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof import.meta.env !== 'undefined' && String(import.meta.env?.REMOTION_DEBUG) === '1')
    return true;
  if (typeof window !== 'undefined' && window.location?.search) {
    const q = window.location.search;
    if (q.includes('remotion_debug=1') || q.includes('debug=1')) return true;
  }
  return false;
}
const DEBUG = isDebugEnabled();

const PREFIX = '[Remotion]';

/** Only log prefetch once per key (Strict Mode runs effects twice). */
const prefetchLogged = new Set<string>();
function prefetchOnce(key: string, msg: string, ...args: unknown[]) {
  if (!DEBUG) return;
  if (prefetchLogged.has(key)) return;
  prefetchLogged.add(key);
  console.log(`${PREFIX} [prefetch]`, msg, ...args);
}

/** Only log slide change once per segment index (multiple composition instances may render). */
let lastSlideIndex: number | null = null;
function slideOnce(segmentIndex: number, msg: string, ...args: unknown[]) {
  if (!DEBUG) return;
  if (lastSlideIndex === segmentIndex) return;
  lastSlideIndex = segmentIndex;
  console.log(`${PREFIX} [slide]`, msg, ...args);
}

export const log = {
  prefetch: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`${PREFIX} [prefetch]`, msg, ...args);
  },
  /** Use for one-off prefetch events (start, complete) to avoid Strict Mode duplicates. */
  prefetchOnce: (key: string, msg: string, ...args: unknown[]) => prefetchOnce(key, msg, ...args),
  slide: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`${PREFIX} [slide]`, msg, ...args);
  },
  /** Use for segment changes so the same segment isn’t logged twice. */
  slideOnce: (segmentIndex: number, msg: string, ...args: unknown[]) =>
    slideOnce(segmentIndex, msg, ...args),
  player: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`${PREFIX} [player]`, msg, ...args);
  },
  /** Mute state (Player sync, composition isMuted). Always logs so you can debug on device without URL param. */
  mute: (msg: string, ...args: unknown[]) => {
    console.log(`${PREFIX} [mute]`, msg, ...args);
  },
  /** General (e.g. mount). */
  app: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`${PREFIX}`, msg, ...args);
  },
};
