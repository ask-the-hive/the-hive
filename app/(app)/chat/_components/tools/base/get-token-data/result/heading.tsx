'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Address from '@/app/_components/address';
import Link from 'next/link';
import SaveToken from '@/app/(app)/_components/save-token';
import { cn } from '@/lib/utils';

interface Props {
  token: {
    name: string;
    symbol: string;
    address: string;
    logoURI: string;
    price?: number;
    priceChange24hPercent?: number;
  };
}

const GetTokenDataResultHeading: React.FC<Props> = ({ token }) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={token.logoURI}
        alt={token.name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover"
        unoptimized
      />
      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:gap-2">
          <h1 className="text-xl font-bold">
            {token.name} ({token.symbol})
          </h1>
          <Address address={token.address} />
          <Link href={`/token/${token.address}?chain=base`}>
            <Button variant="brandOutline" className="p-1 h-6 text-xs w-fit">
              See More
            </Button>
          </Link>
          <SaveToken address={token.address} chain="base" />
        </div>
        <p className="text-sm font-semibold flex items-center gap-1">
          {token.price !== undefined && token.price !== null ? (
            <>
              {'$' + token.price.toLocaleString(undefined, { maximumFractionDigits: 5 })}
              {token.priceChange24hPercent !== undefined &&
                token.priceChange24hPercent !== null && (
                  <span
                    className={cn(
                      'text-xs',
                      token.priceChange24hPercent > 0 ? 'text-green-500' : 'text-red-500',
                    )}
                  >
                    ({token.priceChange24hPercent > 0 ? '+' : ''}
                    {token.priceChange24hPercent.toFixed(2)}%)
                  </span>
                )}
            </>
          ) : (
            'Price not available'
          )}
        </p>
      </div>
    </div>
  );
};

export default GetTokenDataResultHeading;
