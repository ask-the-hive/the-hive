'use client';

import React from 'react';
import { HoneycombBackground, HoveringBees } from '@/components/ui';

export function BrandingSection() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden p-12">
      {/* Honeycomb Pattern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <HoneycombBackground />
        <HoveringBees count={15} />
      </div>

      {/* Content */}
      <div className="max-w-3xl text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Discover. Instruct. Execute.
        </h1>
        <p className="text-xl md:text-2xl text-neutral-400">
          Discover and tap into Decentralized Finance
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
