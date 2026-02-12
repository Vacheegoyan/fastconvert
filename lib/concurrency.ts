/**
 * In-process semaphore to limit concurrent heavy operations (prepare / prepare_poster).
 * Prevents many users from spawning unlimited Python/FFmpeg processes at once.
 *
 * Production: For multi-instance deployments, use a distributed queue (e.g. Bull + Redis).
 */

const MAX_CONCURRENT_CONVERSIONS = 3;

let activeCount = 0;
const waitQueue: Array<() => void> = [];

function release(): void {
  activeCount -= 1;
  if (waitQueue.length > 0 && activeCount < MAX_CONCURRENT_CONVERSIONS) {
    const next = waitQueue.shift();
    if (next) next();
  }
}

/**
 * Acquire a slot for a heavy conversion (prepare/prepare_poster).
 * Resolves when a slot is free. Call release() when done (e.g. in finally).
 */
export function acquireConversionSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeCount < MAX_CONCURRENT_CONVERSIONS) {
      activeCount += 1;
      resolve();
      return;
    }
    waitQueue.push(() => {
      activeCount += 1;
      resolve();
    });
  });
}

/**
 * Release the slot after conversion is done. Always call in finally block.
 */
export function releaseConversionSlot(): void {
  release();
}

/**
 * Run a heavy conversion with concurrency limit.
 * Use for prepare / prepare_poster only.
 */
export async function withConversionSlot<T>(
  fn: () => Promise<T>
): Promise<T> {
  await acquireConversionSlot();
  try {
    return await fn();
  } finally {
    releaseConversionSlot();
  }
}
