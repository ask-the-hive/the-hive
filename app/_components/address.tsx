'use client';

import React, { useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

import { cn } from '@/lib/utils';
import { truncateAddress } from '@/lib/wallet';
import { Copy } from 'lucide-react';

interface Props {
  address: string;
  className?: string;
}

const Address: React.FC<Props> = ({ address, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md w-fit px-2 py-1">
            <p className={cn('text-sm text-muted-foreground', className)} onClick={handleCopy}>
              {truncateAddress(address)}
            </p>
            <Copy className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Address;
