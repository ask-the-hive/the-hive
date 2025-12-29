'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { getUserFacingErrorInfo } from '@/lib/user-facing-error';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  pageKey: string;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if this is a non-critical error that should be ignored
    const isNonCriticalError =
      error.message?.includes('Invalid src prop') ||
      error.message?.includes('hostname') ||
      error.message?.includes('is not configured under images') ||
      error.message?.includes('next-image-unconfigured-host') ||
      error.message?.includes('Encountered two children with the same key') ||
      error.message?.includes('Keys should be unique');

    if (isNonCriticalError) {
      // Log the error but don't show the error boundary
      console.warn('Non-critical error caught and ignored:', error.message);
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log critical errors
    if (!this.state.hasError) return;

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to Sentry with component stack trace and page context
    Sentry.withScope((scope) => {
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      });
      scope.setTag('error_boundary', 'true');
      scope.setTag('page_key', this.props.pageKey);
      Sentry.captureException(error);
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      const info = getUserFacingErrorInfo(this.state.error);
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">{info.title}</h2>
          <p className="text-gray-100 mb-3">{info.message}</p>
          <div className="text-sm text-gray-300 mb-5 space-y-1">
            {isOffline && <p>You appear to be offline.</p>}
            {info.nextSteps.map((step, idx) => (
              <p key={idx}>{step}</p>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try again
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
