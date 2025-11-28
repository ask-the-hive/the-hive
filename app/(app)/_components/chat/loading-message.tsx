'use client';

import React from 'react';

import { Skeleton } from '@/components/ui';

import Logo from '@/components/ui/logo';

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
      <Logo className={cn('w-6 h-6 md:w-10 md:h-10')} />
      <div className="md:pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2 items-start">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export default LoadingMessage;
