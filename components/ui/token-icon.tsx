'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export const FALLBACK_TOKEN_ICON_URL = 'https://www.birdeye.so/images/unknown-token-icon.svg';

interface TokenIconProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Token icon with automatic fallback to unknown token icon
 * Uses Next.js Image component for optimization
 * Automatically falls back if the image fails to load or render
 */
export const TokenIcon: React.FC<TokenIconProps> = ({
  src,
  alt,
  width = 24,
  height = 24,
  className = 'w-6 h-6 rounded-full',
}) => {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_TOKEN_ICON_URL);
  const [hasError, setHasError] = useState(false);

  // Handle image load error - automatically fallback to default icon
  // This catches:
  // - 404 errors (image doesn't exist)
  // - Invalid image data (corrupted files)
  // - CORS issues
  // - Network errors
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_TOKEN_ICON_URL);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
};
