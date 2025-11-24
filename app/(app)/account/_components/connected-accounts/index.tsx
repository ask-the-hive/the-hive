'use client';

import React from 'react';

import { FaEnvelope, FaGoogle, FaPhone, FaXTwitter } from 'react-icons/fa6';

import { usePrivy, type User } from '@privy-io/react-auth';

import { Card } from '@/components/ui';

import ConnectedAccount from './connected-account';

interface Props {
  user: User;
}

const ConnectedAccounts: React.FC<Props> = ({ user }) => {
  const { linkTwitter, linkGoogle, linkEmail, linkPhone } = usePrivy();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Connected Accounts</h1>
      <Card className="flex flex-col gap-8 p-4">
        <ConnectedAccount
          icon={FaXTwitter}
          name="Twitter"
          value={user.twitter?.username ?? undefined}
          isConnected={!!user.twitter}
          onConnect={linkTwitter}
        />
        <ConnectedAccount
          icon={FaGoogle}
          name="Google"
          value={user.google?.email ?? undefined}
          isConnected={!!user.google}
          onConnect={linkGoogle}
        />
        <ConnectedAccount
          icon={FaEnvelope}
          name="Email"
          value={user.email?.address ?? undefined}
          isConnected={!!user.email}
          onConnect={linkEmail}
        />
        <ConnectedAccount
          icon={FaPhone}
          name="Phone"
          value={user.phone?.number ?? undefined}
          isConnected={!!user.phone}
          onConnect={linkPhone}
        />
      </Card>
    </div>
  );
};

export default ConnectedAccounts;
