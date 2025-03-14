"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { FaExternalLinkAlt } from "react-icons/fa";

import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

import { useTokenMarkets } from "@/hooks";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import { MarketSource } from "@/services/birdeye/types";
import { identifyBscDex } from "@/services/birdeye/utils";

interface Props {
    address: string;
}

const TokenMarkets: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;
    
    const { data: markets, isLoading } = useTokenMarkets(address);

    if(isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    if(!markets) {
        return <div className="flex-1 h-0 overflow-hidden">No markets found</div>
    }

    return (
        <Table className="">
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Liquidity</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Unique Wallets</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="h-0 overflow-y-auto no-scrollbar">
                {markets?.items.map((market) => (
                    <TableRow key={market.address}>
                        <TableCell className="w-48">
                            <MarketType type={market.source} address={market.address} tokenAddress={address} chain={chain} marketName={market.name} />
                        </TableCell>
                        <TableCell className="w-48">
                            {market.name}
                        </TableCell>
                        <TableCell>
                            ${market.liquidity.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2, notation: "compact" })}
                        </TableCell>
                        <TableCell>
                            ${market.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2, notation: "compact" })}
                        </TableCell>
                        <TableCell>
                            {market.trade24h.toLocaleString(undefined, { maximumFractionDigits: 0, notation: "compact" })}
                            {market.trade24hChangePercent !== null && (
                                <span className={market.trade24hChangePercent > 0 ? "text-green-500" : "text-red-500"}> ({market.trade24hChangePercent.toFixed(2)}%)</span>
                            )}
                        </TableCell>
                        <TableCell>
                            {market.uniqueWallet24h.toLocaleString(undefined, { maximumFractionDigits: 0, notation: "compact" })}
                            {market.uniqueWallet24hChangePercent !== null && (
                                <span className={market.uniqueWallet24hChangePercent > 0 ? "text-green-500" : "text-red-500"}> ({market.uniqueWallet24hChangePercent.toFixed(2)}%)</span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export const MarketType = ({ type, address, tokenAddress, chain, marketName = '' }: { type: MarketSource, address: string, tokenAddress: string, chain: ChainType, marketName?: string }) => {

    if (chain === 'bsc' && type === address) {
        const bscMarketType = identifyBscDex(address, marketName);
        if (bscMarketType) {
            type = bscMarketType;
        }
    }

    const marketTypeIcons = {
        // Solana markets
        [MarketSource.Raydium]: "/dexes/raydium.png",
        [MarketSource.RaydiumClamm]: "/dexes/raydium.png",
        [MarketSource.RaydiumCp]: "/dexes/raydium.png",
        [MarketSource.MeteoraDlmm]: "/dexes/meteora.png",
        [MarketSource.Meteora]: "/dexes/meteora.png",
        [MarketSource.Orca]: "/dexes/orca.png",
        [MarketSource.Phoenix]: "/dexes/phoenix.jpg",
        
        // BSC markets
        [MarketSource.PancakeSwap]: "/dexes/pancakeswap.png",
        [MarketSource.Uniswap]: "/dexes/uniswap.png",
        [MarketSource.BiSwap]: "/dexes/biswap.png",
        [MarketSource.MDEX]: "/dexes/mdex.png",
        [MarketSource.ApeSwap]: "/dexes/apeswap.png",
        [MarketSource.BabySwap]: "/dexes/babyswap.png",
        [MarketSource.BakerySwap]: "/dexes/bakeryswap.png",
        [MarketSource.BSWSwap]: "/dexes/bswswap.png",
        [MarketSource.ThenaFusion]: "/dexes/thena.png",
        [MarketSource.ThenaAlgebra]: "/dexes/thena.png",
    } as const;

    const iconSrc = marketTypeIcons[type];
    
    // For BSC addresses that couldn't be mapped to a known DEX
    if (chain === 'bsc' && !iconSrc && address === type) {
        return (
            <div className="flex flex-row items-center gap-2">
                <Image 
                    src="/dexes/bsc-generic.png"
                    alt="BSC DEX" 
                    width={16} 
                    height={16} 
                    className="rounded-full"
                />
                <span>BSC DEX</span>
                <MarketLink source={type} address={address} tokenAddress={tokenAddress} chain={chain} />
            </div>
        );
    }
    
    if (!iconSrc) {
        return (
            <div className="flex flex-row items-center gap-2">
                <span>{type}</span>
                <MarketLink source={type} address={address} tokenAddress={tokenAddress} chain={chain} />
            </div>
        );
    }

    return (
        <div className="flex flex-row items-center gap-2">
            <Image 
                src={iconSrc}
                alt={type} 
                width={16} 
                height={16} 
                className="rounded-full"
            />
            <span>{type}</span>
            <MarketLink source={type} address={address} tokenAddress={tokenAddress} chain={chain} />
        </div>
    )
}

export const MarketLink = ({ source, address, tokenAddress, chain }: { source: MarketSource, address: string, tokenAddress: string, chain: ChainType }) => {

    const marketLinks = {
        // Solana market links
        [MarketSource.Raydium]: `https://raydium.io/liquidity/increase/?mode=add&pool_id=${address}`,
        [MarketSource.RaydiumClamm]: `https://raydium.io/clmm/create-position/?pool_id=${address}`,
        [MarketSource.RaydiumCp]: `https://raydium.io/liquidity/increase/?mode=add&pool_id=${address}`,
        [MarketSource.MeteoraDlmm]: `https://app.meteora.ag/dlmm/${address}`,
        [MarketSource.Meteora]: `https://app.meteora.ag/pools/${address}`,
        [MarketSource.Orca]: `https://www.orca.so/pools?tokens=${tokenAddress}`,
        [MarketSource.Phoenix]: `https://app.phoenix.so/pools/${address}`,
        
        // BSC market links
        [MarketSource.PancakeSwap]: `https://pancakeswap.finance/info/pairs/${address}`,
        [MarketSource.Uniswap]: `https://app.uniswap.org/#/pool/${address}`,
        [MarketSource.BiSwap]: `https://exchange.biswap.org/#/swap?outputCurrency=${tokenAddress}`,
        [MarketSource.MDEX]: `https://bsc.mdex.com/#/pool/detail/${address}`,
        [MarketSource.ApeSwap]: `https://apeswap.finance/info/pool/${address}`,
        [MarketSource.BabySwap]: `https://home.babyswap.finance/info/pool/${address}`,
        [MarketSource.BakerySwap]: `https://www.bakeryswap.org/#/pool/${address}`,
        [MarketSource.BSWSwap]: `https://bsw.exchange/pool/${address}`,
        [MarketSource.ThenaFusion]: `https://thena.fi/liquidity/${address}`,
        [MarketSource.ThenaAlgebra]: `https://thena.fi/liquidity/${address}`,
    } as const;

    // Generic BSC DEX explorer link for unknown BSC DEXes
    if (chain === 'bsc' && source === address) {
        return (
            <Link href={`https://bscscan.com/address/${address}`} target="_blank">
                <div className="flex flex-row items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md p-0.5">
                    <FaExternalLinkAlt className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                </div>
            </Link>
        );
    }

    const marketLink = marketLinks[source];
    if (!marketLink) {
        return null;
    }

    return (
        <Link href={marketLink} target="_blank">
            <div className="flex flex-row items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md p-0.5">
                <FaExternalLinkAlt className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
            </div>
        </Link>
    )
}

export default TokenMarkets;