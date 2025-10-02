'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import Header from './_components/header';
import Tokens from './_components/tokens';
import LiquidityPools from './_components/liquidity-pools';
import Transactions from './_components/transactions';

import { SwapModalProvider } from './_contexts/use-swap-modal';
import { useChain } from '@/app/_contexts/chain-context';
import ChainIcon from '@/app/(app)/_components/chain-icon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import PortfolioProjection from './_components/portfolio-projection';

const Portfolio = ({ params }: { params: Promise<{ address: string }> }) => {
  // Unwrap params using React.use()
  const { address } = React.use(params);
  const router = useRouter();
  const { currentChain, setCurrentChain, walletAddresses } = useChain();

  // Auto-switch to BSC if no Solana wallet is connected
  React.useEffect(() => {
    const hasSolana = !!walletAddresses.solana;
    const hasBsc = !!walletAddresses.bsc;

    // If currently on Solana but no Solana wallet is connected, switch to BSC
    if (currentChain === 'solana' && !hasSolana && hasBsc) {
      setCurrentChain('bsc');
    }
  }, [currentChain, walletAddresses, setCurrentChain]);

  // Update URL when chain changes to show correct wallet address
  React.useEffect(() => {
    const newAddress =
      currentChain === 'solana'
        ? walletAddresses.solana
        : currentChain === 'base'
          ? walletAddresses.base
          : walletAddresses.bsc;
    if (newAddress && newAddress !== address) {
      router.replace(`/portfolio/${newAddress}`);
    }
  }, [currentChain, walletAddresses, address, router]);

  // Dropdown handler for chain switching
  const handleChainSwitch = (newChain: 'solana' | 'bsc' | 'base') => {
    setCurrentChain(newChain);
    const newAddress =
      newChain === 'solana'
        ? walletAddresses.solana
        : newChain === 'base'
          ? walletAddresses.base
          : walletAddresses.bsc;
    if (newAddress) {
      router.replace(`/portfolio/${newAddress}?chain=${newChain}`);
    }
  };

  // Determine if there is a wallet for each chain
  const hasSolana = !!walletAddresses.solana;
  const hasBsc = !!walletAddresses.bsc;
  const hasBase = !!walletAddresses.base;
  const hasCurrent =
    currentChain === 'solana' ? hasSolana : currentChain === 'bsc' ? hasBsc : hasBase;

  return (
    <SwapModalProvider>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 md:pt-4 h-full overflow-y-scroll no-scrollbar">
        <div className="flex justify-between items-center">
          <Header address={address} />
          {/* Chain selector dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={!hasCurrent}
              >
                <ChainIcon chain={currentChain} className="w-4 h-4" />
                {currentChain === 'solana' ? 'Solana' : currentChain === 'base' ? 'Base' : 'BSC'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleChainSwitch('solana')}
                className="flex items-center gap-2"
                disabled={!hasSolana}
              >
                <ChainIcon chain="solana" className="w-4 h-4" />
                Solana
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleChainSwitch('bsc')}
                className="flex items-center gap-2"
                disabled={!hasBsc}
              >
                <ChainIcon chain="bsc" className="w-4 h-4" />
                BSC
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleChainSwitch('base')}
                className="flex items-center gap-2"
                disabled={!hasBase}
              >
                <ChainIcon chain="base" className="w-4 h-4" />
                Base
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <PortfolioProjection address={address} />
        <Tokens address={address} />
        <LiquidityPools address={address} />
        <Transactions address={address} />
      </div>
    </SwapModalProvider>
  );
};

export default Portfolio;
