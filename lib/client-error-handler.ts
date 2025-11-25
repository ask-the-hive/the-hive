'use client';

import * as Sentry from '@sentry/nextjs';

/**
 * Capture network/connection errors to Sentry
 * Note: API errors (4xx, 5xx) are already captured server-side
 * This is only for client-side failures like network issues, timeouts, CORS, etc.
 */
export function captureNetworkError(error: Error, url: string, method: string = 'GET') {
  // Only capture actual network failures, not HTTP errors
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('CORS') ||
    error.message.includes('timeout') ||
    error.name === 'TypeError'; // fetch network errors are TypeErrors

  if (isNetworkError) {
    Sentry.withScope((scope) => {
      scope.setContext('network_error', {
        url,
        method,
        errorMessage: error.message,
      });

      scope.setTag('error_type', 'network_error');
      scope.setTag('endpoint', url);

      Sentry.captureException(error);
    });
  }
}

/**
 * Capture user action errors (e.g., form submissions, button clicks)
 */
export function captureUserActionError(
  error: Error,
  action: string,
  additionalContext?: Record<string, any>,
) {
  Sentry.withScope((scope) => {
    scope.setContext('user_action', {
      action,
      ...additionalContext,
    });

    scope.setTag('error_type', 'user_action');
    scope.setTag('action', action);

    Sentry.captureException(error);
  });
}

/**
 * Capture a custom message to Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}
