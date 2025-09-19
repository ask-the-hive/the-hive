if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Comprehensive error suppression for non-critical issues
  const shouldSuppressError = (arg: any): boolean => {
    const message = typeof arg === 'string' ? arg : arg?.message || arg?.toString?.() || '';

    const nonCriticalPatterns = [
      // Wallet connection errors
      'WalletConnectionError: Connection rejected',
      'Connection rejected',

      // Network/SDK errors
      'Raydium_Api',
      'sdk logger error',
      'GET https://tokens.jup.ag/tokens',
      'Network Error',
      'AxiosError',

      // React warnings
      'Encountered two children with the same key',
      'Keys should be unique',
      'Non-unique keys may cause children to be duplicated',

      // Next.js image warnings
      'Invalid src prop',
      'hostname',
      'is not configured under images',
      'next-image-unconfigured-host',

      // Other common non-critical errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
    ];

    return nonCriticalPatterns.some((pattern) => message.includes(pattern));
  };

  console.error = (...args) => {
    if (args.some(shouldSuppressError)) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    if (args.some(shouldSuppressError)) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export {};
