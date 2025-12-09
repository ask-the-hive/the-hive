'use client';

import React from 'react';
import '@/components/utils/suppress-console';
import { Button } from '@/components/ui';
import { useLogin } from '@/hooks';
import { Wallet } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';

interface Props {
  onComplete?: (wallet: Wallet) => void;
  className?: string;
}

const LogInButton: React.FC<Props> = ({ onComplete, className }) => {
  const { login, user, linkWallet } = useLogin({
    onComplete,
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        Sentry.captureException(err, {
          tags: {
            component: 'LogInButton',
            action: 'login',
          },
        });
      }
    },
  });

  return (
    <Button
      variant="brand"
      onClick={() => {
        if (user) {
          linkWallet();
        } else {
          login();
        }
      }}
      className={cn('w-full', className)}
    >
      Connect Wallet
    </Button>
  );
};

export default LogInButton;
