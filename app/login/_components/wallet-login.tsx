'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Loader2, Wallet } from 'lucide-react';
import { useLogin } from '@privy-io/react-auth';

export function WalletLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [connectingWallet, setConnectingWallet] = useState<boolean>(false);

  const { login } = useLogin({
    onComplete: () => {
      router.push('/chat');
    },
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        setError(err?.message || String(err) || 'Failed to connect wallet.');
      }
      setConnectingWallet(false);
    },
  });

  const handleConnectWallet = async () => {
    setError('');
    setConnectingWallet(true);
    // Use login with filtered wallet list - shows only the selected wallet
    await login({
      loginMethods: ['wallet'],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          onClick={() => handleConnectWallet()}
          disabled={connectingWallet}
          variant="brand"
          className="w-full justify-start h-[56px]"
        >
          <div className="flex items-center gap-4 w-full">
            <Wallet className="w-4 h-4" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Connect Wallet to Continue</div>
            </div>
            {connectingWallet && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </Button>
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
