"use client";

import React, { useState } from 'react'

import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

import { cn } from '@/lib/utils';

import { truncateAddress } from '@/lib/wallet';
import { ChainType } from '@/app/_contexts/chain-context';

interface Props {
    hash: string;
    className?: string;
    hideTransactionText?: boolean;
    chain?: ChainType;
}

const TransactionHash: React.FC<Props> = ({ hash, className, hideTransactionText, chain = 'solana' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getExplorerUrl = () => {
        if (chain === 'bsc') {
            return `https://bscscan.com/tx/${hash}`;
        }
        return `https://solscan.io/tx/${hash}`;
    };

    const getExplorerName = () => {
        if (chain === 'bsc') {
            return 'BscScan';
        }
        return 'Solscan';
    };

    return (
        <div className="flex flex-row gap-1 items-center">
            {
                !hideTransactionText && (
                    <p className="text-sm">
                        Transaction:
                    </p>
                )
            }
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <p 
                            className={cn("text-sm cursor-pointer text-brand-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md w-fit px-1", className)}
                            onClick={handleCopy}
                        >
                            {truncateAddress(hash)}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-2">
                        <div className="flex flex-row gap-2 items-center">
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                {copied ? "Copied" : "Copy Hash"}
                            </Button>
                            <Link href={getExplorerUrl()} target="_blank">
                                <Button variant="outline" size="sm">
                                    {getExplorerName()} <ArrowUpRight className="size-4" />
                                </Button>
                            </Link>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

export default TransactionHash;