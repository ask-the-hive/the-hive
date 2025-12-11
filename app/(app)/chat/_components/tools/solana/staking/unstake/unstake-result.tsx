import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle, Undo2, XCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useChain } from '@/app/_contexts/chain-context';
import type { UnstakeResultType } from '@/ai';

type Props = {
  result: UnstakeResultType;
};

const UnstakeResult: React.FC<Props> = ({ result }) => {
  const { currentWalletAddress } = useChain();
  const portfolioPath = currentWalletAddress ? `/portfolio/${currentWalletAddress}` : '/portfolio';

  if (!result.body) {
    return (
      <p className="text-xs text-muted-foreground">
        {result.message || 'Unable to process unstake request.'}
      </p>
    );
  }

  const { status, symbol, inputAmount, tx } = result.body;

  if (status === 'guide') {
    return (
      <Card className="p-4 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-black border border-zinc-800 shadow-inner shadow-black/30">
        <div className="flex items-center gap-2 text-foreground mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Undo2 className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-semibold text-sm">How to unstake</span>
        </div>
        <div className="space-y-1 text-foreground/90 text-sm">
          <p>1) Open your portfolio page</p>
          <p>2) Select your staking position (e.g., mSOL, JupSOL)</p>
          <p>3) Tap Unstake/Withdraw to swap back to SOL</p>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          <Button asChild size="sm" variant="secondary" className="flex items-center gap-1">
            <Link href={portfolioPath}>
              <span>Open Portfolio</span>
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const statusCopy: Record<string, { label: string; icon?: React.ReactNode; tone: string }> = {
    pending: {
      label: `Ready to unstake${symbol ? ` ${inputAmount ?? ''} ${symbol}` : ''}`,
      icon: <Undo2 className="w-4 h-4" />,
      tone: 'text-amber-400',
    },
    complete: {
      label: 'Unstaked successfully',
      icon: <CheckCircle className="w-4 h-4" />,
      tone: 'text-emerald-400',
    },
    cancelled: {
      label: 'Unstake cancelled',
      icon: <XCircle className="w-4 h-4" />,
      tone: 'text-muted-foreground',
    },
    failed: {
      label: 'Unstake failed',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      tone: 'text-red-400',
    },
  };

  const copy = statusCopy[status] ?? statusCopy.pending;

  return (
    <div className="flex flex-col gap-2 text-sm text-foreground">
      <div className="flex items-center gap-2">
        {copy.icon}
        <span className={cn('font-medium', copy.tone)}>{copy.label}</span>
      </div>
      {tx && (
        <Link
          href={`https://solscan.io/tx/${tx}`}
          target="_blank"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View transaction
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      )}
      {result.message && <p className="text-xs text-muted-foreground">{result.message}</p>}
    </div>
  );
};

export default UnstakeResult;
