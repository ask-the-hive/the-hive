'use client';

import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  compressed?: boolean;
}

const LoadingMessage: React.FC<Props> = ({ compressed }) => {
  return (
    <div
      className={cn(
        // base styles
        'flex w-full px-2 py-4 max-w-full last:border-b-0',
        // mobile styles
        'gap-2',
        // desktop styles
        'md:gap-4 md:px-4',
        compressed && 'md:gap-2 md:px-2 px-0',
      )}
    >
      <div
        className={cn('hidden md:flex shrink-0', compressed ? 'md:h-6 md:w-6' : 'md:h-10 md:w-10')}
      >
        <Image
          src="/hive-thinking.gif"
          alt="The Hive is thinking"
          width={compressed ? 24 : 40}
          height={compressed ? 24 : 40}
          className="h-full w-full object-contain"
          priority
          unoptimized
        />
      </div>
      <div className="md:pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2 items-start">
        <Skeleton className={cn('h-7', compressed ? 'w-1/2' : 'w-2/3')} />
        <Skeleton className={cn('h-4', compressed ? 'w-1/3' : 'w-1/2')} />
      </div>
    </div>
  );
};

export default LoadingMessage;
