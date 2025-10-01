import React, { useEffect } from 'react';

import LoginButton from '@/app/(app)/_components/log-in-button';

import ToolCard from '../../tool-card';

import { usePrivy, Wallet, useWallets } from '@privy-io/react-auth';

import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';

import type { ToolInvocation } from 'ai';
import type { GetWalletAddressResultType } from '@/ai/bsc/actions/wallet/get-wallet-address/types';
import WalletDisplay from '@/components/ui/wallet-display';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetWalletAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting BSC Wallet Address...`}
      result={{
        heading: (result: GetWalletAddressResultType) =>
          result.body ? `Fetched BSC Wallet Address` : 'No BSC wallet address found',
        body: (result: GetWalletAddressResultType) =>
          result.body ? (
            <WalletDisplay address={result.body.address} />
          ) : (
            <p className="text-md font-medium text-muted-foreground">No BSC wallet address found</p>
          ),
      }}
      call={{
        heading: 'Connect BSC Wallet',
        body: (toolCallId: string) => <GetWalletAddressAction toolCallId={toolCallId} />,
      }}
      prevToolAgent={prevToolAgent}
    />
  );
};

const GetWalletAddressAction = ({ toolCallId }: { toolCallId: string }) => {
  const { setCurrentChain } = useChain();
  const { user } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { addToolResult, isLoading } = useChat();

  // Set the current chain to BSC
  useEffect(() => {
    setCurrentChain('bsc');
  }, [setCurrentChain]);

  // Check for BSC wallets
  useEffect(() => {
    if (!isLoading && walletsReady) {
      // First try to find a BSC wallet from useWallets
      const evmWallets = wallets.filter((wallet) => wallet.address.startsWith('0x'));
      if (evmWallets.length > 0) {
        const bscWallet = evmWallets[0]; // Use the first EVM wallet
        addToolResult(toolCallId, {
          message: 'BSC Wallet connected',
          body: {
            address: bscWallet.address,
          },
        });
        return;
      }

      // Fallback to user's main wallet if it's an EVM wallet
      if (user?.wallet?.address && user.wallet.address.startsWith('0x')) {
        addToolResult(toolCallId, {
          message: 'BSC Wallet connected',
          body: {
            address: user.wallet.address,
          },
        });
        return;
      }
    }
  }, [user, wallets, walletsReady, isLoading, addToolResult, toolCallId]);

  const onComplete = (wallet: Wallet) => {
    // Only use the wallet if it's an EVM wallet (BSC)
    if (wallet.address.startsWith('0x')) {
      addToolResult(toolCallId, {
        message: 'BSC Wallet connected',
        body: {
          address: wallet.address,
        },
      });
    } else {
      // If it's not a BSC wallet, show an error
      addToolResult(toolCallId, {
        message: 'Please connect a BSC wallet (address starting with 0x)',
        body: {
          address: '',
        },
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <LoginButton onComplete={onComplete} />
    </div>
  );
};

export default GetWalletAddress;
