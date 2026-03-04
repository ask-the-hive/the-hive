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

  // Calculate normalized X position for each hexagon (0 to 1) for wave animation
  const hexagonNormalizedX = useMemo(() => {
    if (hexagons.length === 0) return new Map();
    const minX = Math.min(...hexagons.map(h => h.x));
    const maxX = Math.max(...hexagons.map(h => h.x));
    const rangeX = maxX - minX;
    const normalizedMap = new Map<string, number>();
    hexagons.forEach(hex => {
      const normalizedX = rangeX > 0 ? (hex.x - minX) / rangeX : 0.5;
      normalizedMap.set(hex.id, normalizedX);
    });
    return normalizedMap;
  }, [hexagons]);

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
      const maxRadius = hexWidth * 4; // Larger glow radius for smoother effect
      const intensity = Math.max(0, 1 - distance / maxRadius);
      return Math.pow(intensity, 1.5); // Smoother falloff
    },
    [getDistance, hexWidth],
  );

  // Add lingering effect state
  const [lingeringGlow, setLingeringGlow] = useState<Map<string, number>>(new Map());
  const [lingeringTimeout, setLingeringTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Wave animation state
  const [waveTime, setWaveTime] = useState(0);
  
  // Wave animation loop
  useEffect(() => {
    if (isDissolving) return;
    
    let animationFrame: number;
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds
      
      // Wave cycle: 8 seconds total
      // 0-3.2s: Left to right
      // 3.2-4s: Pause
      // 4-7.2s: Right to left
      // 7.2-8s: Pause
      const cycleTime = elapsed % 8;
      setWaveTime(cycleTime);
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isDissolving]);
  
  // Calculate wave intensity for a hexagon based on its X position and current time
  const getWaveIntensity = useCallback((hex: Hexagon) => {
    if (isDissolving) return 0;
    
    const normalizedX = hexagonNormalizedX.get(hex.id) || 0.5;
    const waveWidth = 0.2; // Width of the wave pulse (20% of screen)
    
    // Left to right wave (0-3.2s)
    if (waveTime >= 0 && waveTime < 3.2) {
      const wavePosition = waveTime / 3.2; // 0 to 1
      const distanceFromWave = Math.abs(normalizedX - wavePosition);
      if (distanceFromWave < waveWidth) {
        const intensity = 1 - (distanceFromWave / waveWidth);
        // Return intensity 0-1, where 1 means full pulse (30% opacity), 0 means base (10% opacity)
        return Math.max(0, Math.min(1, intensity));
      }
    }
    
    // Right to left wave (4-7.2s)
    if (waveTime >= 4 && waveTime < 7.2) {
      const wavePosition = 1 - ((waveTime - 4) / 3.2); // 1 to 0
      const distanceFromWave = Math.abs(normalizedX - wavePosition);
      if (distanceFromWave < waveWidth) {
        const intensity = 1 - (distanceFromWave / waveWidth);
        // Return intensity 0-1, where 1 means full pulse (30% opacity), 0 means base (10% opacity)
        return Math.max(0, Math.min(1, intensity));
      }
    }
    
    return 0;
  }, [waveTime, hexagonNormalizedX, isDissolving]);

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
          const maxRadius = hexWidth * 2; // Smaller radius - fewer hexagons light up
          const intensity = Math.max(0, 1 - distance / maxRadius);
          if (intensity > 0) {
            newLingeringGlow.set(hex.id, Math.pow(intensity, 1.2)); // Smoother falloff
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
  const finalWidth = baseWidth; // Full width to fill screen
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
          const maxRadius = hexWidth * 2; // Smaller glow radius - fewer hexagons light up
          const intensity = Math.max(0, 1 - distance / maxRadius);
          return Math.pow(intensity, 1.2); // Smoother falloff
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
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
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
            const strokeWidth = 1 + glowIntensity * 3; // 1 to 4px (proportional to smaller hexagons)
            
            // Get wave intensity (0-1, where 1 = full pulse)
            const waveIntensity = getWaveIntensity(hex);
            
            // Calculate dissolve delay based on distance from center (wave pattern)
            const distanceFromCenter = getHexagonDistanceFromCenter(hex);
            const normalizedDistance = distanceFromCenter / maxDistance;
            const dissolveDelay = isDissolving ? normalizedDistance * 1.2 : 0; // 1.2s total wave duration
            const dissolveOpacity = isDissolving ? Math.max(0, 1 - (normalizedDistance * 1.5)) : 1;
            
            // Calculate stroke opacity
            // If hovering/glowing, use the glow opacity
            // Otherwise, use wave animation: 0.2 (base) to 0.8 (pulse) based on wave intensity
            let strokeOpacity: number;
            if (isDissolving) {
              const baseOpacity = glowIntensity > 0 ? (0.6 + glowIntensity * 0.4) : 0.6;
              strokeOpacity = baseOpacity * dissolveOpacity;
            } else if (glowIntensity > 0) {
              // When hovering, use glow opacity
              strokeOpacity = 0.6 + glowIntensity * 0.4;
            } else {
              // Wave animation: interpolate from 0.2 (base) to 0.8 (pulse) for much more visibility
              strokeOpacity = 0.2 + waveIntensity * 0.6;
            }

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
                    transitionProperty: isDissolving
                      ? 'stroke-opacity, opacity'
                      : glowIntensity > 0 
                        ? 'stroke, stroke-width, stroke-opacity, filter'
                        : 'stroke-opacity',
                    transitionDuration: isDissolving
                      ? '0.6s'
                      : glowIntensity > 0
                        ? '0.4s'
                        : '0.15s',
                    transitionTimingFunction: isDissolving
                      ? 'ease-out'
                      : glowIntensity > 0
                        ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                        : 'ease-out',
                    transitionDelay: isDissolving ? `${dissolveDelay}s` : '0s',
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
