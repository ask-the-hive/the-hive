"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

import { Skeleton } from "@/components/ui";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";

import WalletAddress from "@/app/_components/wallet-address";

import { Connection, PublicKey } from "@solana/web3.js";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import { useTopHolders } from "@/hooks/queries/token/use-top-holders";

import { getStreamsByMint } from "@/services/streamflow";

import { knownAddresses } from "@/lib/known-addresses";
import { bscKnownAddresses } from "@/lib/bsc-known-addresses";
import { AddressType, KnownAddress } from "@/types/known-address";

import type { TokenHolder } from "@/services/birdeye/types";

interface Props {
    mint: string;
}

const TopHolders: React.FC<Props> = ({ mint }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    const { data: topHolders, isLoading, error } = useTopHolders(mint);
    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [knownAddressesMap, setKnownAddressesMap] = useState<Record<string, KnownAddress>>(
        chain === 'bsc' ? bscKnownAddresses : knownAddresses
    );

    // Function to fetch additional data based on chain
    const fetchChainSpecificData = useCallback(async () => {
        if (chain === 'solana') {
            try {
                const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
                const mintInfo = await connection.getTokenSupply(new PublicKey(mint));
                setTotalSupply(Number(BigInt(mintInfo.value.amount) / BigInt(Math.pow(10, mintInfo.value.decimals))));

                const streamflowAccounts = await getStreamsByMint(mint);
                
                const updatedAddresses = { ...knownAddresses };
                
                streamflowAccounts.forEach(account => {
                    if (account.account.escrowTokens) {
                        updatedAddresses[account.account.escrowTokens] = {
                            name: "Streamflow Vault",
                            logo: "/vesting/streamflow.png",
                            type: AddressType.VestingVault
                        };
                    }
                });
                
                setKnownAddressesMap(updatedAddresses);
            } catch (error) {
                console.error("Error fetching Solana token data:", error);
            }
        }
    }, [mint, chain]);

    // Update known addresses when chain changes
    useEffect(() => {
        setKnownAddressesMap(chain === 'bsc' ? bscKnownAddresses : knownAddresses);
    }, [chain]);

    // Fetch data when component mounts
    useEffect(() => {
        fetchChainSpecificData();
    }, [mint, fetchChainSpecificData]);

    // Handle loading state
    if(isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    // Handle error or empty data
    if(error || !topHolders || topHolders.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full p-4">
                <div className="text-center">
                    <p className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                        {error ? "Error loading top holders" : "No top holders data available"}
                    </p>
                    <p className="text-sm text-neutral-500 mt-2">
                        {error ? "Please try again later" : "We couldn't find any top holders for this token"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 pl-4">Rank</TableHead>
                        <TableHead>Holder</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topHolders.map((topHolder, index) => (
                        <TopHolder
                            key={topHolder.owner} 
                            topHolder={topHolder}
                            percentageOwned={chain === 'bsc' ? (topHolder.percentage || 0) : (totalSupply > 0 ? topHolder.ui_amount / totalSupply * 100 : 0)}
                            index={index}
                            knownAddresses={knownAddressesMap}
                            chain={chain}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface TopHolderProps {
    topHolder: TokenHolder;
    percentageOwned: number;
    index: number;
    knownAddresses: Record<string, KnownAddress>;
    chain: ChainType;
}

const TopHolder = ({ topHolder, percentageOwned, index, knownAddresses, chain }: TopHolderProps) => {
    const knownAddress = knownAddresses[topHolder.owner];
    const hasValidLogo = knownAddress?.logo && knownAddress.logo.length > 0;

    return (
        <TableRow>
            <TableCell className="pl-4">
                {index + 1}
            </TableCell>
            <TableCell>
                {knownAddress ? (
                    <div className="flex flex-row items-center gap-2">
                        {hasValidLogo && (
                            <Image
                                src={knownAddress.logo}
                                alt={knownAddress.name}
                                width={16}
                                height={16}
                                className="rounded-full"
                            />
                        )}
                        <p className="font-bold">
                            {knownAddress.name}
                        </p>
                        {knownAddress.type && (
                            <span className="text-xs text-neutral-500">({knownAddress.type})</span>
                        )}
                    </div>
                ) : (
                    <WalletAddress 
                        address={topHolder.owner} 
                        className="font-bold"
                        chain={chain}
                    />
                )}
            </TableCell>
            <TableCell className="text-right">
                {topHolder.ui_amount.toLocaleString()} {percentageOwned > 0 && `(${percentageOwned.toFixed(2)}%)`}
            </TableCell>
        </TableRow>
    )
}

export default TopHolders;