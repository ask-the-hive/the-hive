'use client';

import React from 'react';
import { HoneycombBackground } from '@/components/ui/honeycomb-background';

export function BrandingSection() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden p-12">
      {/* Honeycomb Pattern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <HoneycombBackground />
      </div>

      <div className="max-w-3xl text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Ask. Compare. Earn.</h1>
        <p className="text-xl md:text-2xl text-neutral-400">
          Discover yields, compare options, and act through a single agent interface.
        </p>
      </div>
    </div>
  );
}
