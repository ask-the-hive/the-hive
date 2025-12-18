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
  const { login, user, linkWallet, isPrivyModalOpen } = useLogin({
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

  if (isPrivyModalOpen) {
    return (
      <div className={cn('w-full flex items-center justify-center', className)}>
        <p className="text-sm text-muted-foreground">Continue in the Privy modal…</p>
      </div>
    );
  }

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
      className={cn(
        'w-full relative overflow-hidden',
        '!bg-gradient-to-r !from-[#d3a32d] !to-[#b67617]',
        'dark:!from-[#d3a32d] dark:!to-[#b67617]',
        '!text-neutral-50 !font-medium',
        '!border-0',
        'shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)]',
        'dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]',
        'hover:shadow-[0_3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]',
        'dark:hover:shadow-[0_3px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]',
        'before:absolute before:inset-0 before:pointer-events-none before:z-0 before:rounded-full',
        'before:bg-[linear-gradient(135deg,transparent_0%,transparent_40%,rgba(255,255,255,0.12)_48%,rgba(255,255,255,0.14)_50%,rgba(255,255,255,0.12)_52%,transparent_60%,transparent_100%)]',
        'before:translate-x-[-100%] before:translate-y-[-100%] before:rotate-45',
        'hover:before:animate-premium-shimmer',
        '[&>*]:relative [&>*]:z-10',
        className
      )}
    >
      Connect Wallet
    </Button>
  );
};

export default LogInButton;
