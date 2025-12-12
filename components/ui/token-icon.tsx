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
  const hasValidSrc = src !== null && src !== undefined && src !== '';
  const startingWithSrc = hasValidSrc;
  const startingWithLocalIcon = !hasValidSrc && !!localIcon;
  const initialSrc = hasValidSrc ? src : localIcon || FALLBACK_TOKEN_ICON_URL;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [triedSrc, setTriedSrc] = useState(startingWithSrc);
  const [triedLocalIcon, setTriedLocalIcon] = useState(startingWithLocalIcon);

  useEffect(() => {
    const newLocalIcon = getLocalTokenIcon(tokenSymbol);
    const newHasValidSrc = src !== null && src !== undefined && src !== '';
    const newSrc = newHasValidSrc ? src : newLocalIcon || FALLBACK_TOKEN_ICON_URL;

    setImgSrc(newSrc);
    setTriedSrc(newHasValidSrc);
    setTriedLocalIcon(!newHasValidSrc && !!newLocalIcon);
  }, [src, tokenSymbol]);

  const handleError = () => {
    if (triedSrc && !triedLocalIcon && localIcon) {
      setTriedLocalIcon(true);
      setImgSrc(localIcon);
    } else if (imgSrc !== FALLBACK_TOKEN_ICON_URL) {
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
