import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "twitter-api-v2",
    "ai",
    "@ai-sdk/openai",
    "@ai-sdk/anthropic",
    "@ai-sdk/xai",
    "@ai-sdk/google",
    "@ai-sdk/deepseek"
  ],
  images: {
    domains: [
      "logo.moralis.io"
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace child_process with an empty module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "child_process": false
      };
    }
    return config;
  }
};

export default nextConfig;
