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
      <Card className="p-8 bg-neutral-900/80 border border-neutral-800 shadow-lg shadow-black/30 mb-4 mt-4 w-full max-w-full space-y-4">
        <div className="flex items-center gap-2 text-foreground text-center">
          <span className="font-semibold text-lg w-full">How to unstake</span>
        </div>
        <div className="space-y-2 text-foreground/90 text-sm">
          <p>1) Open your portfolio page</p>
          <p>2) Select your staking position (e.g., mSOL, JupSOL)</p>
          <p>3) Tap Unstake/Withdraw to swap back to SOL</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="brand"
            className="border- flex items-center justify-center gap-2 w-full rounded-full text-base py-3 mt-4"
          >
            <Link href={portfolioPath}>
              <span className="text-sm">Open Portfolio</span>
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
