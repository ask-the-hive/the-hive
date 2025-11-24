'use client';

import React from 'react';

import { Button } from '@/components/ui';

import type { IconType } from 'react-icons';

interface Props {
  icon: IconType;
  name: string;
  value: string | undefined;
  isConnected: boolean;
  onConnect: () => void;
}

const ConnectedAccount: React.FC<Props> = ({ icon: Icon, name, value, isConnected, onConnect }) => {
  return (
    <div className="flex flex-row gap-2 items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-700">
          <Icon />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold">{name}</p>
          <p className="text-xs text-muted-foreground">{value ?? 'Not Connected'}</p>
        </div>
      </div>
      {!isConnected && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-4 text-xs"
          onClick={onConnect}
          disabled={isConnected}
        >
          Connect
        </Button>
      )}
    </div>
  );
};

export default ConnectedAccount;
