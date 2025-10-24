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
    <div className="relative h-screen overflow-hidden">
      {/* Honeycomb Background - Fixed */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
        <HoneycombBackground />
      </div>

      {/* Content - Scrollable */}
      <div className="relative z-10 h-full max-w-3xl mx-auto overflow-y-auto">
        <div className="flex flex-col max-w-3xl mx-auto gap-8 p-6 pb-20">
          <AccountHeading user={user} />
          <ConnectedAccounts user={user} />
        </div>
      </div>
    </div>
  );
};

export default AccountComponents;
