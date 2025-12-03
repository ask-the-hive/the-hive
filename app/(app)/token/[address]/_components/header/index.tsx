'use client';

import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui';
import Address from '@/app/_components/address';
import Links from './token-links';
import { useTokenOverview } from '@/hooks';
import SaveToken from '@/app/(app)/_components/save-token';

interface Props {
  address: string;
}

const Header: React.FC<Props> = ({ address }) => {
  const { data: tokenOverview, isLoading } = useTokenOverview(address);

  if (isLoading) {
    return <Skeleton className="h-6 w-full" />;
  }

  if (!tokenOverview) {
    return <div>No token found</div>;
  }

  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-2">
        <Image
          src={tokenOverview.logoURI || 'https://www.birdeye.so/images/unknown-token-icon.svg'}
          alt={tokenOverview.name}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover"
          unoptimized
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{tokenOverview.name}</h1>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {tokenOverview.symbol}
            </span>
            <SaveToken address={address} />
          </div>
          <Address address={address} className="text-xs" />
        </div>
      </div>
      {tokenOverview.extensions && <Links extensions={tokenOverview.extensions} />}
    </div>
  );
};

export default Header;
