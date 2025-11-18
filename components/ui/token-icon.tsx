'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export const FALLBACK_TOKEN_ICON_URL = 'https://www.birdeye.so/images/unknown-token-icon.svg';

interface TokenIconProps {
  src?: string | null;
  alt: string;
  tokenSymbol?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Get local token icon path if available
 * @param symbol - Token symbol (e.g., "FUSD", "USDG")
 * @returns Local path or null if not available
 */
const getLocalTokenIcon = (symbol?: string): string | null => {
  if (!symbol) return null;

  const normalizedSymbol = symbol.toLowerCase();
  const availableIcons = ['fdusd', 'usdg'];

  if (availableIcons.includes(normalizedSymbol)) {
    return `/token-icons/${normalizedSymbol}.png`;
  }

  return null;
};

/**
 * Token icon with automatic fallback to unknown token icon
 * Uses Next.js Image component for optimization
 * Automatically falls back in this order:
 * 1. Provided src
 * 2. Local token icon (if tokenSymbol matches available icons)
 * 3. Generic unknown token icon
 */
export const TokenIcon: React.FC<TokenIconProps> = ({
  src,
  alt,
  tokenSymbol,
  width = 24,
  height = 24,
  className = 'w-6 h-6 rounded-full',
}) => {
  const localIcon = getLocalTokenIcon(tokenSymbol);

  // Determine initial source and what we're starting with
  const hasValidSrc = src !== null && src !== undefined && src !== '';
  const startingWithSrc = hasValidSrc;
  const startingWithLocalIcon = !hasValidSrc && !!localIcon;

  const initialSrc = hasValidSrc ? src : localIcon || FALLBACK_TOKEN_ICON_URL;

  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [triedSrc, setTriedSrc] = useState(startingWithSrc);
  const [triedLocalIcon, setTriedLocalIcon] = useState(startingWithLocalIcon);

  // Update image source when src or tokenSymbol changes
  useEffect(() => {
    const newLocalIcon = getLocalTokenIcon(tokenSymbol);
    const newHasValidSrc = src !== null && src !== undefined && src !== '';
    const newSrc = newHasValidSrc ? src : newLocalIcon || FALLBACK_TOKEN_ICON_URL;

    // Reset to new source when props change
    setImgSrc(newSrc);
    setTriedSrc(newHasValidSrc);
    setTriedLocalIcon(!newHasValidSrc && !!newLocalIcon);
  }, [src, tokenSymbol]);

  // Handle image load error - automatically fallback to next available icon
  // Fallback order: original src -> local token icon -> generic fallback
  // This catches:
  // - 404 errors (image doesn't exist)
  // - Invalid image data (corrupted files)
  // - CORS issues
  // - Network errors
  const handleError = () => {
    // If we started with src and haven't tried local icon yet, try it
    if (triedSrc && !triedLocalIcon && localIcon) {
      setTriedLocalIcon(true);
      setImgSrc(localIcon);
    } else if (imgSrc !== FALLBACK_TOKEN_ICON_URL) {
      // Fall back to generic icon
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
