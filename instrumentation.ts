import * as Sentry from '@sentry/nextjs';
import { startCacheWarmers } from './lib/cache-warmer';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    startCacheWarmers();
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
