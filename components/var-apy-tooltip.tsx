import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const VarApyTooltip: React.FC<Props> = ({ size = 'sm', className }) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <InfoIcon
            className={cn(
              sizeClasses[size],
              'text-gray-600 dark:text-gray-400 cursor-pointer',
              className,
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs p-2">
            APY is variable and subject to market conditions. Historical rates are not indicative of
            future performance. Actual yields may vary.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VarApyTooltip;
