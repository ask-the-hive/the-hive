import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import { useChat } from '@/app/(app)/chat/_contexts/chat';

import LoginButton from '@/app/(app)/_components/log-in-button';
import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { GetWalletAddressResultType } from '@/ai/base/actions/wallet/get-wallet-address/types';
import type { Wallet } from '@privy-io/react-auth';
import WalletDisplay from '@/components/ui/wallet-display';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetWalletAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting BASE Wallet Address...`}
      result={{
        heading: (result: GetWalletAddressResultType) =>
          result.body ? `Fetched BASE Wallet Address` : 'No BASE wallet address found',
        body: (result: GetWalletAddressResultType) =>
          result.body ? (
            <WalletDisplay address={result.body.address} />
          ) : (
            <p className="text-md font-medium text-muted-foreground">
              No BASE wallet address found
            </p>
          ),
      }}
      call={{
        heading: 'Connect BASE Wallet',
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

  // Set the current chain to BASE
  useEffect(() => {
    setCurrentChain('base');
  }, [setCurrentChain]);

  // Check for BASE wallets
  useEffect(() => {
    if (!isLoading && walletsReady) {
      // First try to find a BASE wallet from useWallets
      const evmWallets = wallets.filter((wallet) => wallet.address.startsWith('0x'));
      if (evmWallets.length > 0) {
        const baseWallet = evmWallets[0]; // Use the first EVM wallet
        addToolResult(toolCallId, {
          message: 'BASE Wallet connected',
          body: {
            address: baseWallet.address,
          },
        });
        return;
      }

      // Fallback to user's main wallet if it's an EVM wallet
      if (user?.wallet?.address && user.wallet.address.startsWith('0x')) {
        addToolResult(toolCallId, {
          message: 'BASE Wallet connected',
          body: {
            address: user.wallet.address,
          },
        });
        return;
      }
    }
  }, [user, wallets, walletsReady, addToolResult, toolCallId, isLoading]);

  const onComplete = (wallet: Wallet) => {
    // Only use the wallet if it's an EVM wallet (BASE)
    if (wallet.address.startsWith('0x')) {
      addToolResult(toolCallId, {
        message: 'BASE Wallet connected',
        body: {
          address: wallet.address,
        },
      });
    } else {
      // If it's not a BASE wallet, show an error
      addToolResult(toolCallId, {
        message: 'Please connect a BASE wallet (address starting with 0x)',
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
