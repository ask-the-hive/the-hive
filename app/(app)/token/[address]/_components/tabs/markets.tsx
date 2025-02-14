"use client";

import React from "react";

import Image from "next/image";
import Link from "next/link";

import { FaExternalLinkAlt } from "react-icons/fa";

import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

import { useTokenMarkets } from "@/hooks";

import { MarketSource } from "@/services/birdeye/types";

interface Props {
    address: string;
}

const TokenMarkets: React.FC<Props> = ({ address }) => {
    
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
                            <MarketType type={market.source} address={market.address} tokenAddress={address} />
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

export const MarketType = ({ type, address, tokenAddress }: { type: MarketSource, address: string, tokenAddress: string }) => {

    const marketTypeIcons = {
        [MarketSource.Raydium]: "/dexes/raydium.png",
        [MarketSource.RaydiumClamm]: "/dexes/raydium.png",
        [MarketSource.RaydiumCp]: "/dexes/raydium.png",
        [MarketSource.MeteoraDlmm]: "/dexes/meteora.png",
        [MarketSource.Meteora]: "/dexes/meteora.png",
        [MarketSource.Orca]: "/dexes/orca.png",
        [MarketSource.Phoenix]: "/dexes/phoenix.jpg",
    } as const;

    const iconSrc = marketTypeIcons[type];
    if (!iconSrc) {
        return (
            <div className="flex flex-row items-center gap-2">
                <span>{type}</span>
                <MarketLink source={type} address={address} tokenAddress={tokenAddress} />
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
            <MarketLink source={type} address={address} tokenAddress={tokenAddress} />
        </div>
    )
}

export const MarketLink = ({ source, address, tokenAddress }: { source: MarketSource, address: string, tokenAddress: string }) => {

    const marketLinks = {
        [MarketSource.Raydium]: `https://raydium.io/liquidity/increase/?mode=add&pool_id=${address}`,
        [MarketSource.RaydiumClamm]: `https://raydium.io/clmm/create-position/?pool_id=${address}`,
        [MarketSource.RaydiumCp]: `https://raydium.io/liquidity/increase/?mode=add&pool_id=${address}`,
        [MarketSource.MeteoraDlmm]: `https://app.meteora.ag/dlmm/${address}`,
        [MarketSource.Meteora]: `https://app.meteora.ag/pools/${address}`,
        [MarketSource.Orca]: `https://www.orca.so/pools?tokens=${tokenAddress}`,
        [MarketSource.Phoenix]: `https://app.phoenix.so/pools/${address}`,
    } as const;

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