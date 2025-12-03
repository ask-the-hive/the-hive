'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';

interface HoneycombBackgroundProps {
  className?: string;
  rows?: number;
  cols?: number;
  cellSize?: number;
}

interface Hexagon {
  x: number;
  y: number;
  id: string;
  row: number;
  col: number;
}

export const HoneycombBackground: React.FC<HoneycombBackgroundProps> = ({
  className = '',
  rows = 16,
  cols = 24,
  cellSize = 420,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Hexagon geometry constants
  const hexWidth = cellSize;
  const hexHeight = (Math.sqrt(3) / 2) * hexWidth;

  // Generate grid of hexagons (memoized to prevent infinite loops)
  const hexagons: Hexagon[] = useMemo(() => {
    const hexArray: Hexagon[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = col * (hexWidth * 0.75);
        const offsetY = row * hexHeight + (col % 2 ? hexHeight / 2 : 0);
        hexArray.push({ x: offsetX, y: offsetY, id: `${row}-${col}`, row, col });
      }
    }
    return hexArray;
  }, [rows, cols, hexWidth, hexHeight]);

  // Calculate distance from mouse to hexagon center
  const getDistance = useCallback(
    (hex: Hexagon, mouse: { x: number; y: number }) => {
      const hexCenterX = hex.x + hexWidth / 2;
      const hexCenterY = hex.y + hexHeight / 2;
      return Math.sqrt((mouse.x - hexCenterX) ** 2 + (mouse.y - hexCenterY) ** 2);
    },
    [hexWidth, hexHeight],
  );

  // Get glow intensity based on distance (0-1)
  const getGlowIntensity = useCallback(
    (hex: Hexagon, mouse: { x: number; y: number }) => {
      const distance = getDistance(hex, mouse);
      const maxRadius = hexWidth * 1.5; // Glow radius
      const intensity = Math.max(0, 1 - distance / maxRadius);
      return Math.pow(intensity, 2); // Square for smoother falloff
    },
    [getDistance, hexWidth],
  );

  // Add lingering effect state
  const [lingeringGlow, setLingeringGlow] = useState<Map<string, number>>(new Map());
  const [lingeringTimeout, setLingeringTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update lingering glow effect
  useEffect(() => {
    if (isHovering) {
      // Clear any existing timeout
      if (lingeringTimeout) {
        clearTimeout(lingeringTimeout);
        setLingeringTimeout(null);
      }

      // Update lingering glow for all hexagons
      const newLingeringGlow = new Map();
      hexagons.forEach((hex) => {
        const intensity = getGlowIntensity(hex, mousePos);
        if (intensity > 0) {
          newLingeringGlow.set(hex.id, intensity);
        }
      });
      setLingeringGlow(newLingeringGlow);
    } else {
      // Start 3-second fade out
      const timeout = setTimeout(() => {
        setLingeringGlow(new Map());
        setLingeringTimeout(null);
      }, 3000);
      setLingeringTimeout(timeout);
    }

    return () => {
      if (lingeringTimeout) {
        clearTimeout(lingeringTimeout);
      }
    };
  }, [isHovering, mousePos, hexagons, getGlowIntensity]);

  // Calculate viewBox - make it bigger to fill more screen
  const baseWidth = cols * hexWidth * 0.75 + hexWidth;
  const baseHeight = rows * hexHeight + hexHeight;
  const finalWidth = baseWidth * 0.5; // Make it larger to fill corners
  const finalHeight = baseHeight;

  // Get final glow intensity (current hover or lingering)
  const getFinalGlowIntensity = useCallback(
    (hex: Hexagon, mouse: { x: number; y: number }) => {
      if (isHovering) {
        return getGlowIntensity(hex, mouse);
      }
      return lingeringGlow.get(hex.id) || 0;
    },
    [isHovering, getGlowIntensity, lingeringGlow],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();

      // Convert screen coordinates to SVG coordinates using the expanded viewBox
      let x = ((e.clientX - rect.left) / rect.width) * finalWidth;
      let y = ((e.clientY - rect.top) / rect.height) * finalHeight;

      // Account for the translation offset in the transform
      x += baseWidth * 0.05;
      y += baseHeight * 0.05;

      // Apply inverse rotation to account for the 15-degree rotation in the transform
      // Since the hexagons are rotated 15° clockwise, we need to rotate the mouse position
      // -15° (counter-clockwise) around the center to align with the rotated coordinate system
      const centerX = baseWidth / 2;
      const centerY = baseHeight / 2;
      const angle = -15 * (Math.PI / 180); // -15 degrees in radians

      // Step 1: Translate mouse position so rotation center is at origin
      const translatedX = x - centerX;
      const translatedY = y - centerY;

      // Step 2: Apply 2D rotation matrix
      const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
      const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

      // Step 3: Translate back to original coordinate system
      x = rotatedX + centerX;
      y = rotatedY + centerY;

      setMousePos({ x, y });
    },
    [finalWidth, finalHeight, baseWidth, baseHeight],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${finalWidth} ${finalHeight}`}
        preserveAspectRatio="xMidYMid slice"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Base gradient */}
          <linearGradient id="honeycomb-gradient" x1="0%" y1="0%" x2="500%" y2="500%">
            <stop offset="0%" stopColor="#d19900" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#b8860b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#505050" stopOpacity="0.3" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="honey-glow" x="0%" y="0%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          transform={`translate(-${baseWidth * 0.05}, -${baseHeight * 0.05}) rotate(15 ${baseWidth / 2} ${baseHeight / 2})`}
        >
          {hexagons.map((hex) => {
            const glowIntensity = getFinalGlowIntensity(hex, mousePos);
            const strokeWidth = 2.5 + glowIntensity * 6; // 2.5 to 8.5px (much thicker glow)
            const strokeOpacity = 0.6 + glowIntensity * 0.4; // 0.6 to 1.0 (higher base opacity)

            return (
              <g key={hex.id}>
                {/* Invisible fill area for hover detection */}
                <polygon
                  points={`
                    ${hex.x + 0.25 * hexWidth},${hex.y}
                    ${hex.x + 0.75 * hexWidth},${hex.y}
                    ${hex.x + hexWidth},${hex.y + 0.5 * hexHeight}
                    ${hex.x + 0.75 * hexWidth},${hex.y + hexHeight}
                    ${hex.x + 0.25 * hexWidth},${hex.y + hexHeight}
                    ${hex.x},${hex.y + 0.5 * hexHeight}
                  `}
                  fill="transparent"
                  className="honeycomb-cell"
                />
                {/* Visible stroke with dynamic glow */}
                <polygon
                  points={`
                    ${hex.x + 0.25 * hexWidth},${hex.y}
                    ${hex.x + 0.75 * hexWidth},${hex.y}
                    ${hex.x + hexWidth},${hex.y + 0.5 * hexHeight}
                    ${hex.x + 0.75 * hexWidth},${hex.y + hexHeight}
                    ${hex.x + 0.25 * hexWidth},${hex.y + hexHeight}
                    ${hex.x},${hex.y + 0.5 * hexHeight}
                  `}
                  fill="none"
                  stroke={glowIntensity > 0 ? '#ffd700' : 'url(#honeycomb-gradient)'}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  filter={glowIntensity > 0 ? 'url(#honey-glow)' : 'none'}
                  style={{
                    transition:
                      'stroke 0.2s ease-out, stroke-width 0.2s ease-out, stroke-opacity 0.2s ease-out, filter 0.2s ease-out',
                    transitionDelay: glowIntensity > 0 ? '0s' : '0s',
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
