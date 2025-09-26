import React, { useEffect } from 'react';

import LoginButton from '@/app/(app)/_components/log-in-button';

import ToolCard from '../tool-card';

import { usePrivy, Wallet } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';

import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';

import type { ToolInvocation } from 'ai';
import type { GetWalletAddressResultType } from '@/ai';
import WalletDisplay from '@/components/ui/wallet-display';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetWalletAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting Solana Wallet Address...`}
      result={{
        heading: (result: GetWalletAddressResultType) =>
          result.body ? `Fetched Solana Wallet Address` : 'No Solana wallet address found',
        body: (result: GetWalletAddressResultType) =>
          result.body ? (
            <WalletDisplay address={result.body.address} />
          ) : (
            <p className="text-md font-medium text-muted-foreground">
              No Solana wallet address found
            </p>
          ),
      }}
      call={{
        heading: 'Connect Solana Wallet',
        body: (toolCallId: string) => <GetWalletAddressAction toolCallId={toolCallId} />,
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const GetWalletAddressAction = ({ toolCallId }: { toolCallId: string }) => {
  console.log('Solana GetWalletAddressAction component mounted', { toolCallId });

  const { setCurrentChain } = useChain();
  const { user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { addToolResult, isLoading } = useChat();

  // Set the current chain to Solana
  useEffect(() => {
    console.log('Setting current chain to Solana');
    setCurrentChain('solana');
  }, [setCurrentChain]);

  // Check for Solana wallets
  useEffect(() => {
    if (!isLoading) {
      console.log('Checking for Solana wallet', {
        userWallet: user?.wallet?.address,
        solanaWallets: solanaWallets.map((w) => ({ address: w.address })),
      });

      // First try to find a Solana wallet from the useSolanaWallets hook
      if (solanaWallets.length > 0) {
        const solanaWallet = solanaWallets[0]; // Use the first Solana wallet
        console.log('Found Solana wallet from useSolanaWallets:', solanaWallet.address);
        addToolResult(toolCallId, {
          message: 'Solana Wallet connected',
          body: {
            address: solanaWallet.address,
          },
        });
        return;
      }

      // Fallback to user's main wallet if it's a Solana wallet (not starting with 0x)
      if (user?.wallet?.address && !user.wallet.address.startsWith('0x')) {
        console.log('Using main Solana wallet address:', user.wallet.address);
        addToolResult(toolCallId, {
          message: 'Solana Wallet connected',
          body: {
            address: user.wallet.address,
          },
        });
        return;
      }
    }
  }, [user, solanaWallets, isLoading, addToolResult, toolCallId]);

  const onComplete = (wallet: Wallet) => {
    console.log('Wallet connection completed:', wallet);
    // Only use the wallet if it's a Solana wallet (not starting with 0x)
    if (!wallet.address.startsWith('0x')) {
      addToolResult(toolCallId, {
        message: 'Solana Wallet connected',
        body: {
          address: wallet.address,
        },
      });
    } else {
      // If it's not a Solana wallet, show an error
      addToolResult(toolCallId, {
        message: 'Please connect a Solana wallet (address not starting with 0x)',
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
