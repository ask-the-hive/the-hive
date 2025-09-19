import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    'twitter-api-v2',
    'ai',
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/xai',
    '@ai-sdk/google',
    '@ai-sdk/deepseek',
  ],
  // Remove console logs in production (but keep errors/warnings for debugging)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
  images: {
    // More permissive image configuration
    domains: [
      'logo.moralis.io',
      'cdn.moralis.io',
      'avatars.githubusercontent.com',
      'raw.githubusercontent.com',
      'assets.coingecko.com',
      'storage.googleapis.com',
      'static.jup.ag',
    ],
    // Allow remote patterns for dynamic image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization warnings in development
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace child_process with an empty module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
