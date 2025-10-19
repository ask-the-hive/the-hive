'use client';

import React from 'react';

export function BrandingSection() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden p-12">
      {/* Honeycomb Pattern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
          <g transform="rotate(45 50 50)">
            <rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#honeycomb)" />
            <rect x="-50%" y="-50%" width="200%" height="200%" fill="url(#honeycomb-offset)" />
          </g>
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-2xl text-center relative z-10">
        <h1 className="text-5xl md:text-5xl font-bold text-white mb-6">
          Discover, instruct and execute with <span className="text-brand-600">The Hive</span>
        </h1>
        <p className="text-xl md:text-2xl text-neutral-400">
          Find and tap into the top DeFi yields
        </p>

        {/* Decorative glow elements */}
        <div className="mt-12 flex justify-center gap-6 opacity-20">
          <div className="w-24 h-24 rounded-full bg-brand-600 blur-3xl"></div>
          <div className="w-32 h-32 rounded-full bg-brand-500 blur-3xl"></div>
          <div className="w-24 h-24 rounded-full bg-brand-400 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
