'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';

interface HoneycombBackgroundProps {
  className?: string;
  rows?: number;
  cols?: number;
  cellSize?: number;
  isDissolving?: boolean;
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
  isDissolving = false,
}) => {
  const [hoveredHexId, setHoveredHexId] = useState<string | null>(null);
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
  // Note: hex positions are in the transformed coordinate system (after translate and rotate)
  const getDistance = useCallback(
    (hex: Hexagon, mouse: { x: number; y: number }) => {
      // Hexagon center in transformed coordinates
      const hexCenterX = hex.x + hexWidth / 2;
      const hexCenterY = hex.y + hexHeight / 2;
      // Mouse position should already be in the same transformed coordinate system
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

  // Update lingering glow effect when hovering
  useEffect(() => {
    if (isHovering && hoveredHexId) {
      // Clear any existing timeout
      if (lingeringTimeout) {
        clearTimeout(lingeringTimeout);
        setLingeringTimeout(null);
      }

      // Update lingering glow for all hexagons based on distance from hovered hex
      const newLingeringGlow = new Map();
      const hoveredHex = hexagons.find(h => h.id === hoveredHexId);
      if (hoveredHex) {
        const hoveredCenterX = hoveredHex.x + hexWidth / 2;
        const hoveredCenterY = hoveredHex.y + hexHeight / 2;
        
        hexagons.forEach((hex) => {
          const hexCenterX = hex.x + hexWidth / 2;
          const hexCenterY = hex.y + hexHeight / 2;
          const distance = Math.sqrt(
            (hexCenterX - hoveredCenterX) ** 2 + (hexCenterY - hoveredCenterY) ** 2
          );
          const maxRadius = hexWidth * 2;
          const intensity = Math.max(0, 1 - distance / maxRadius);
          if (intensity > 0) {
            newLingeringGlow.set(hex.id, Math.pow(intensity, 1.5));
          }
        });
      }
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
  }, [isHovering, hoveredHexId, hexagons, hexWidth, hexHeight]);

  // Calculate viewBox - make it bigger to fill more screen
  const baseWidth = cols * hexWidth * 0.75 + hexWidth;
  const baseHeight = rows * hexHeight + hexHeight;
  const finalWidth = baseWidth * 0.5; // Make it larger to fill corners
  const finalHeight = baseHeight;

  // Calculate center point for wave animation
  const centerX = baseWidth / 2;
  const centerY = baseHeight / 2;

  // Calculate distance from center for each hexagon (for wave animation)
  const getHexagonDistanceFromCenter = useCallback(
    (hex: Hexagon) => {
      const hexCenterX = hex.x + hexWidth / 2;
      const hexCenterY = hex.y + hexHeight / 2;
      return Math.sqrt((hexCenterX - centerX) ** 2 + (hexCenterY - centerY) ** 2);
    },
    [centerX, centerY, hexWidth, hexHeight],
  );

  // Calculate max distance for normalization
  const maxDistance = useMemo(() => {
    if (hexagons.length === 0) return 1;
    return Math.max(...hexagons.map(getHexagonDistanceFromCenter));
  }, [hexagons, getHexagonDistanceFromCenter]);

  // Get final glow intensity (current hover or lingering)
  const getFinalGlowIntensity = useCallback(
    (hex: Hexagon) => {
      // If this hexagon is directly hovered, full intensity
      if (hoveredHexId === hex.id) {
        return 1;
      }
      
      // If hovering and this hex is near the hovered one, calculate distance-based glow
      if (isHovering && hoveredHexId) {
        const hoveredHex = hexagons.find(h => h.id === hoveredHexId);
        if (hoveredHex) {
          const hoveredCenterX = hoveredHex.x + hexWidth / 2;
          const hoveredCenterY = hoveredHex.y + hexHeight / 2;
          const hexCenterX = hex.x + hexWidth / 2;
          const hexCenterY = hex.y + hexHeight / 2;
          const distance = Math.sqrt(
            (hexCenterX - hoveredCenterX) ** 2 + (hexCenterY - hoveredCenterY) ** 2
          );
          const maxRadius = hexWidth * 2; // Glow radius
          const intensity = Math.max(0, 1 - distance / maxRadius);
          return Math.pow(intensity, 1.5); // Smooth falloff
        }
      }
      
      // Use lingering glow if available
      return lingeringGlow.get(hex.id) || 0;
    },
    [hoveredHexId, isHovering, hexagons, hexWidth, hexHeight, lingeringGlow],
  );

  const handleHexagonMouseEnter = useCallback((hexId: string) => {
    setHoveredHexId(hexId);
    setIsHovering(true);
  }, []);

  const handleHexagonMouseLeave = useCallback(() => {
    setHoveredHexId(null);
    setIsHovering(false);
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${finalWidth} ${finalHeight}`}
        preserveAspectRatio="xMidYMid slice"
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
            const glowIntensity = isDissolving ? 0 : getFinalGlowIntensity(hex);
            const strokeWidth = 2.5 + glowIntensity * 6; // 2.5 to 8.5px (much thicker glow)
            
            // Calculate dissolve delay based on distance from center (wave pattern)
            const distanceFromCenter = getHexagonDistanceFromCenter(hex);
            const normalizedDistance = distanceFromCenter / maxDistance;
            const dissolveDelay = isDissolving ? normalizedDistance * 1.2 : 0; // 1.2s total wave duration
            const dissolveOpacity = isDissolving ? Math.max(0, 1 - (normalizedDistance * 1.5)) : 1;
            
            const strokeOpacity = isDissolving 
              ? (0.6 + glowIntensity * 0.4) * dissolveOpacity
              : (0.6 + glowIntensity * 0.4);

            return (
              <g key={hex.id}>
                {/* Invisible fill area for hover detection */}
                {!isDissolving && (
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
                    onMouseEnter={() => handleHexagonMouseEnter(hex.id)}
                    onMouseLeave={handleHexagonMouseLeave}
                    style={{ cursor: 'pointer' }}
                  />
                )}
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
                    transition: isDissolving
                      ? `stroke-opacity 0.6s ease-out, opacity 0.6s ease-out`
                      : 'stroke 0.2s ease-out, stroke-width 0.2s ease-out, stroke-opacity 0.2s ease-out, filter 0.2s ease-out',
                    transitionDelay: isDissolving ? `${dissolveDelay}s` : (glowIntensity > 0 ? '0s' : '0s'),
                    opacity: dissolveOpacity,
                    pointerEvents: 'none',
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
