if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args) => {
      // Suppress wallet connection errors
      if (
        args[0]?.includes?.('WalletConnectionError: Connection rejected') ||
        args[0]?.message?.includes?.('Connection rejected') ||
        (typeof args[0] === 'object' && args[0]?.toString?.()?.includes?.('Connection rejected'))
      ) {
        return;
      }
      
      // Suppress Raydium/Jupiter network errors (non-critical)
      if (
        args[0]?.includes?.('Raydium_Api') ||
        args[0]?.includes?.('sdk logger error') ||
        args[0]?.includes?.('GET https://tokens.jup.ag/tokens') ||
        args[0]?.includes?.('Network Error') ||
        (typeof args[0] === 'object' && args[0]?.message?.includes?.('Network Error')) ||
        (typeof args[0] === 'object' && args[0]?.name === 'AxiosError' && args[0]?.message?.includes?.('Network Error'))
      ) {
        return;
      }
      
      originalError.apply(console, args);
    };
  }
  
  export {};