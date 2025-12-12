'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { Undo2 } from 'lucide-react';
import { useChain } from '@/app/_contexts/chain-context';
import { type UnstakeArgumentsType } from '@/ai';

interface Props {
  toolCallId: string;
  args: UnstakeArgumentsType;
}

const UnstakeCallBody: React.FC<Props> = () => {
  const { setCurrentChain, currentWalletAddress } = useChain();
  const portfolioPath = currentWalletAddress ? `/portfolio/${currentWalletAddress}` : '/portfolio';

  useEffect(() => {
    setCurrentChain('solana');
  }, [setCurrentChain]);

  return (
    <Card className="p-6 mt-2 max-w-full bg-neutral-900/80 border border-neutral-800 shadow-lg shadow-black/30 mb-4">
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Undo2 className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-semibold">Unstake guidance</span>
        </div>
        <div className="space-y-1 text-foreground/90">
          <p>1) Open your portfolio page</p>
          <p>2) Select your staking position (e.g., mSOL, JupSOL)</p>
          <p>3) Tap Unstake/Withdraw to swap back to SOL</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" variant="secondary" className="flex items-center gap-1">
            <Link href={portfolioPath}>
              <span>Open Portfolio</span>
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UnstakeCallBody;
