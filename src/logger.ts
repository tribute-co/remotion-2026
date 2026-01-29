/**
 * Basic app logging. Only logs when DEV or when REMOTION_DEBUG=1 (e.g. in env).
 * Use for prefetch, slide changes, etc.
 * Note: We use prefetch (blob-url) only; we do not use Remotion preload or premount.
 * Dedupe keys avoid duplicate logs from React Strict Mode (double-invoke) or multiple instances.
 * If you see "Initial prefetch" etc. again later, it's usually HMR (file save in dev) or the
 * component remounting; the dedupe Set is cleared when this module is re-executed.
 */
const DEBUG =
  import.meta.env.DEV ||
  (typeof import.meta.env !== 'undefined' && String(import.meta.env?.REMOTION_DEBUG) === '1');

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
  /** General (e.g. mount). */
  app: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`${PREFIX}`, msg, ...args);
  },
};
