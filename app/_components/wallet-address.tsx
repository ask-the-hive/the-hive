"use client";

import React, { useEffect, useState } from 'react'

import Image from 'next/image';

import Link from 'next/link';

import { ArrowUpRight, Copy } from 'lucide-react';

import { Button, Skeleton, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

import TokenBalance from './token-balance';

import { usePortfolio } from '@/hooks';

import { cn } from '@/lib/utils';

import { ArkhamAddress } from '@/services/arkham/types/base-response';
import { arkhamEntityLogos } from '@/lib/arkham-entity-logos';

interface Props {
    address: string;
    className?: string;
}

const WalletAddress: React.FC<Props> = ({ address, className }) => {

    const [arkhamAddress, setArkhamAddress] = useState<ArkhamAddress | null>(null);

    useEffect(() => {
        const fetchArkhamEntity = async () => {
            try {
                const entity = await fetch(`/api/arkham/address/${address}`)
                const data = await entity.json();
                setArkhamAddress(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchArkhamEntity();
    }, [address]);
    
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
                    {
                        (arkhamAddress?.arkhamEntity && arkhamAddress?.arkhamLabel?.name) ? (
                            <div className="flex flex-row items-center gap-2">
                                {
                                    arkhamAddress.arkhamEntity.id && 
                                    arkhamEntityLogos[arkhamAddress.arkhamEntity.id as keyof typeof arkhamEntityLogos] && (
                                        <Image
                                            src={arkhamEntityLogos[arkhamAddress.arkhamEntity.id as keyof typeof arkhamEntityLogos]}
                                            alt={arkhamAddress.arkhamEntity.name}
                                            width={16}
                                            height={16}
                                            className="rounded-full"
                                        />
                                    )
                                }
                                <p
                                    className={cn("text-sm text-muted-foreground cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md w-fit px-1", className)}
                                >
                                    {`${arkhamAddress.arkhamEntity.name} (${arkhamAddress.arkhamLabel.name})`}
                                </p>
                            </div>
                        ) : (
                            <p 
                                className={cn("text-sm text-muted-foreground cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md w-fit px-1", className)}
                            >
                                {address.slice(0, 4)}...${address.slice(-4)}
                            </p>
                        )
                    }
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex flex-col gap-4">
                    <WalletBalances address={address} />
                    <div className="flex flex-row gap-2">
                        <Link href={`https://solscan.io/address/${address}`} target="_blank">
                            <Button variant="outline" size="sm">
                                Solscan <ArrowUpRight className="size-4" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            {copied ? "Copied" : "Copy"} <Copy className="size-4" />
                        </Button>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const WalletBalances = ({ address }: { address: string }) => {

    const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(address);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                <h3 className="text-sm font-bold">
                    Balances
                </h3>
                {
                    portfolioLoading ? (
                        <Skeleton className="h-4 w-24" /> 
                    ) : (
                        portfolio && (
                            <p className="text-xs font-bold">
                                ${portfolio.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        )
                    )
                }
            </div>
            {
                portfolioLoading ? (
                    <Skeleton className="h-16 w-full" />
                ) : (
                    portfolio ? (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                            {portfolio.items.filter((item) => item.valueUsd > 0.01).map((token) => (
                                <TokenBalance 
                                    key={token.address}
                                    symbol={token.symbol}
                                    balance={token.uiAmount}
                                    logoURI={token.logoURI}
                                    name={token.name}
                                    price={token.priceUsd}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No balances found</p>
                    )
                    
                )
            }
        </div>
    )
}

export default WalletAddress;