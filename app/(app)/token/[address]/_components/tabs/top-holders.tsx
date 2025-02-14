"use client"

import React, { useEffect, useState } from "react";

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

import { useTopHolders } from "@/hooks/queries/token/use-top-holders";

import { getStreamsByMint } from "@/services/streamflow";

import { knownAddresses } from "@/lib/known-addresses";

import type { TokenHolder } from "@/services/birdeye/types";

interface Props {
    mint: string;
}

const TopHolders: React.FC<Props> = ({ mint }) => {

    const { data: topHolders, isLoading } = useTopHolders(mint);

    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [streamflowAddresses, setStreamflowAddresses] = useState<Record<string, { name: string, logo: string }>>(knownAddresses);

    useEffect(() => {
        const fetchData = async () => {
            const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
            const mintInfo = await connection.getTokenSupply(new PublicKey(mint));
            setTotalSupply(Number(BigInt(mintInfo.value.amount) / BigInt(Math.pow(10, mintInfo.value.decimals))));

            const streamflowAccounts = await getStreamsByMint(mint);
            
            setStreamflowAddresses(streamflowAccounts.reduce((acc, account) => {
                if (account.account.escrowTokens) {
                    acc[account.account.escrowTokens] = {
                        name: "Streamflow Vault",
                        logo: "/vesting/streamflow.png"
                    };
                }
                return acc;
            }, { ...knownAddresses } as Record<string, { name: string, logo: string }>));
        };

        fetchData();
    }, [mint]);

    if(isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    return (
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
                        percentageOwned={topHolder.ui_amount / totalSupply * 100}
                        index={index}
                        knownAddresses={streamflowAddresses}
                    />
                ))}
            </TableBody>
        </Table>
    )
}

interface TopHolderProps {
    topHolder: TokenHolder;
    percentageOwned: number;
    index: number;
    knownAddresses: Record<string, { name: string, logo: string }>;
}

const TopHolder = ({ topHolder, percentageOwned, index, knownAddresses }: TopHolderProps) => {
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
                            />
                        )}
                        <p className="font-bold">
                            {knownAddress.name}
                        </p>
                    </div>
                ) : (
                    <WalletAddress 
                        address={topHolder.owner} 
                        className="font-bold"
                    />
                )}
            </TableCell>
            <TableCell className="text-right">
                {topHolder.ui_amount.toLocaleString()} ({percentageOwned.toFixed(2)}%)
            </TableCell>
        </TableRow>
    )
}

export default TopHolders;