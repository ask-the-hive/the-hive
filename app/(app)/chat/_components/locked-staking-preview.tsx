'use client';

import React from 'react';
import { Card, TokenIcon } from '@/components/ui';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { capitalizeWords } from '@/lib/string-utils';

interface LockedStakingPreviewProps {
  pool: {
    symbol: string;
    project: string;
    apy: number;
    tokenLogoURI?: string | null;
  };
  onClose: () => void;
  isUnlocking?: boolean;
}

const LockedStakingPreview: React.FC<LockedStakingPreviewProps> = ({
  pool,
  onClose,
  isUnlocking = false,
}) => {
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  React.useEffect(() => {
    if (isUnlocking) {
      // Create particle burst effect
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
      }));
      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => setParticles([]), 1500);
    }
  }, [isUnlocking]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Card
        className={cn(
          'p-4 max-w-full locked-preview-container',
          isUnlocking && 'unlocking',
        )}
      >
        {/* Particle Burst */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: '50%',
              top: '50%',
              '--tx': `${particle.x}px`,
              '--ty': `${particle.y}px`,
            } as React.CSSProperties}
          />
        ))}
          <div className="w-full">
            <div className="text-center space-y-2 mb-4">
              <h3 className="font-semibold text-lg">
                Stake to {capitalizeWords(pool.project || pool.symbol)}
              </h3>
              <div className="flex items-center justify-center text-center gap-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Earn{' '}
                  <span className="text-green-400 font-medium">{pool.apy.toFixed(2)}%</span> APY
                </p>
              </div>
            </div>

            {/* Preview Swap Interface */}
            <div className="space-y-4 opacity-60">
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Stake</span>
                  <div className="flex items-center gap-2">
                    <TokenIcon
                      src={undefined}
                      alt="SOL"
                      tokenSymbol="SOL"
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm font-medium">SOL</span>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-neutral-400">0.00</div>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Receive</span>
                  <div className="flex items-center gap-2">
                    {pool.tokenLogoURI && (
                      <TokenIcon
                        src={pool.tokenLogoURI}
                        alt={pool.symbol}
                        tokenSymbol={pool.symbol}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">{pool.symbol}</span>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-neutral-400">0.00</div>
              </div>

              <button
                className="w-full py-3 px-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-500 rounded-lg cursor-not-allowed"
                disabled
              >
                Connect Wallet to Stake
              </button>
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="locked-overlay absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800/90 border-2 border-neutral-600 flex items-center justify-center">
                <Lock className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-lg font-semibold text-neutral-200">
                Connect Wallet to Unlock
              </p>
            </div>
          </div>
        </Card>
    </div>
  );
};

export default LockedStakingPreview;

