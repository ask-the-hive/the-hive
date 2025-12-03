import React from 'react';
import { Card } from './card';
import { Icon } from './icon';
import { Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface Props {
  address: string;
}

const WalletDisplay: React.FC<Props> = ({ address }) => {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <div className="flex flex-col gap-4">
          <Card className="flex w-full p-4">
            <div className="flex flex-row gap-2 items-center justify-between w-full">
              <div className="flex flex-row gap-2 items-center">
                <Icon name="Wallet" className="w-8 h-8" />
                <p className="text-md font-medium text-muted-foreground">
                  {address.slice(0, 6)}...{address.slice(-6)}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(address);
                      }}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletDisplay;
