import React from "react";

import Image from "next/image";

import { Button, Card, Separator } from "@/components/ui";

import type { MoralisPair } from "@/services/moralis/get-token-pairs";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

interface Props {
    pair: MoralisPair;
    children: React.ReactNode;
}

export const BscPoolStats: React.FC<Props> = ({ pair, children }) => {
    // Get token info from the pair
    const baseToken = pair.pair[0];
    const quoteToken = pair.pair[1];

    // Create a link to BscScan for the pair
    const bscScanUrl = `https://bscscan.com/address/${pair.pair_address}`;

    // Default token logo if missing
    const defaultTokenLogo = "/placeholder-token.png";

    return (
        <Card className="flex flex-col gap-4 p-2">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-12 h-8">
                            {baseToken.token_logo ? (
                                <Image 
                                    src={baseToken.token_logo} 
                                    alt={baseToken.token_name} 
                                    width={24} 
                                    height={24} 
                                    className="rounded-full absolute top-0 left-0"
                                    onError={(e) => {
                                        // Fallback to default image on error
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = defaultTokenLogo;
                                    }}
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 absolute top-0 left-0 flex items-center justify-center">
                                    <span className="text-xs">{baseToken.token_symbol?.charAt(0) || '?'}</span>
                                </div>
                            )}
                            {quoteToken.token_logo ? (
                                <Image 
                                    src={quoteToken.token_logo} 
                                    alt={quoteToken.token_name} 
                                    width={24} 
                                    height={24} 
                                    className="rounded-full absolute bottom-0 right-0"
                                    onError={(e) => {
                                        // Fallback to default image on error
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = defaultTokenLogo;
                                    }}
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 absolute bottom-0 right-0 flex items-center justify-center">
                                    <span className="text-xs">{quoteToken.token_symbol?.charAt(0) || '?'}</span>
                                </div>
                            )}
                        </div>
                        <h3>{baseToken.token_symbol || 'Unknown'} / {quoteToken.token_symbol || 'Unknown'}</h3>
                    </div>
                    <Link href={bscScanUrl} target="_blank">
                        <Button variant="ghost" size="sm">
                            BscScan
                            <ArrowUpRightIcon className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full justify-between">
                        <div className="flex flex-col justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                                    Volume 24h
                                </h3>
                                <p className="text-sm font-medium">
                                    ${typeof pair.volume_24h_usd === 'number' ? pair.volume_24h_usd.toLocaleString() : '0'}
                                </p>
                            </div>
                            <Separator />
                        </div>
                        <div className="flex flex-col justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                                    Price
                                </h3>
                                <p className="text-sm font-medium">
                                    ${typeof pair.usd_price === 'number' ? pair.usd_price.toLocaleString() : '0'}
                                </p>
                            </div>
                            <Separator />
                        </div>
                        <div className="flex flex-col justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
                                    Liquidity
                                </h3>
                                <p className="text-sm font-medium">
                                    ${typeof pair.liquidity_usd === 'number' ? pair.liquidity_usd.toLocaleString() : '0'}
                                </p>
                            </div>
                            <Separator />
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </Card>
    )
} 