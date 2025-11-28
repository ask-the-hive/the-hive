'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

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
      error.message?.includes('Keys should be unique') ||
      error.message?.includes('Network Error') ||
      error.message?.includes('Raydium_Api');

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

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            An unexpected error occurred. Please try again. If the problem persists, please contact
            support.
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
