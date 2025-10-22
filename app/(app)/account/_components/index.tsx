'use client';

import React from 'react';
import '@/components/utils/suppress-console';
import { usePrivy } from '@privy-io/react-auth';
import { HoneycombBackground } from '@/components/ui/honeycomb-background';
import { Skeleton } from '@/components/ui';
import AccountHeading from './heading';
import ConnectedAccounts from './connected-accounts';

const AccountComponents: React.FC = () => {
  const { user, ready } = usePrivy();

  if (!ready) {
    return <Skeleton className="h-full w-full" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Honeycomb Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <HoneycombBackground />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col max-w-3xl mx-auto gap-20 p-6">
        <AccountHeading user={user} />
        <ConnectedAccounts user={user} />
      </div>
    </div>
  );
};

export default AccountComponents;
