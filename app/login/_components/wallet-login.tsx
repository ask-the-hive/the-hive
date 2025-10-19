'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks';

const walletOptions = [
  {
    name: 'Phantom',
    id: 'phantom' as const,
    icon: '👻',
    description: 'Solana wallet',
  },
  {
    name: 'MetaMask',
    id: 'metamask' as const,
    icon: '🦊',
    description: 'Ethereum wallet',
  },
  {
    name: 'Coinbase Wallet',
    id: 'coinbase_wallet' as const,
    icon: '🔵',
    description: 'Multi-chain wallet',
  },
  {
    name: 'WalletConnect',
    id: 'wallet_connect' as const,
    icon: '🔗',
    description: 'Connect any wallet',
  },
];

export function WalletLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const { login } = useLogin({
    onComplete: () => {
      router.push('/chat');
    },
  });

  const handleConnectWallet = async (walletType: string) => {
    try {
      setError('');
      setConnectingWallet(walletType);
      login();
    } catch (err: any) {
      setError(err?.message || String(err) || 'Failed to connect wallet.');
      setConnectingWallet(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {walletOptions.map((wallet) => (
          <Button
            key={wallet.id}
            onClick={() => handleConnectWallet(wallet.id)}
            disabled={connectingWallet !== null}
            variant="outline"
            className="w-full justify-start h-[56px]"
          >
            <div className="flex items-center gap-4 w-full">
              <span className="text-xl">{wallet.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">{wallet.name}</div>
                <div className="text-xs text-neutral-400">{wallet.description}</div>
              </div>
              {connectingWallet === wallet.id && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </Button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="text-xs text-neutral-500 text-center">
        By connecting a wallet, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}
