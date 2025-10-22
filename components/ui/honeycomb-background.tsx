'use client';

import React from 'react';

interface HoneycombBackgroundProps {
  className?: string;
}

export const HoneycombBackground: React.FC<HoneycombBackgroundProps> = ({ className = '' }) => {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient that spans the entire viewbox from gold to grey */}
        <linearGradient id="honeycomb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d19900" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#b8860b" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#8b7355" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#505050" stopOpacity="0.08" />
        </linearGradient>

        {/* Honeycomb pattern using the gradient */}
        <pattern
          id="honeycomb"
          x="0"
          y="0"
          width="121"
          height="105.6"
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points="30.25,0 90.75,0 121,52.64 90.75,105.27 30.25,105.27 0,52.64"
            fill="none"
            stroke="url(#honeycomb-gradient)"
            strokeWidth="3"
          />
        </pattern>
        <pattern
          id="honeycomb-offset"
          x="60.5"
          y="52.64"
          width="121"
          height="105.6"
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points="30.25,0 90.75,0 121,52.64 90.75,105.27 30.25,105.27 0,52.64"
            fill="none"
            stroke="url(#honeycomb-gradient)"
            strokeWidth="3"
            opacity="0.6"
          />
        </pattern>
      </defs>
      {/* Much larger coverage to ensure pattern reaches all corners */}
      <g transform="translate(20, -30) rotate(45 50 50)">
        <rect x="-100%" y="-100%" width="500%" height="500%" fill="url(#honeycomb)" />
        <rect x="-100%" y="-100%" width="500%" height="500%" fill="url(#honeycomb-offset)" />
      </g>
    </svg>
  );
};
