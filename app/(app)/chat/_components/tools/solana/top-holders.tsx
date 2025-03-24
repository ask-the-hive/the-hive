import React, { useEffect, useState } from 'react'

import Image from 'next/image';

import { Button } from '@/components/ui';
import { Card } from '@/components/ui/card';

import WalletAddress from '@/app/_components/wallet-address';

import ToolCard from '../tool-card';

import { getStreamsByMint } from '@/services/streamflow';

import type { ToolInvocation } from 'ai';
import type { TopHoldersResultBodyType, TopHoldersResultType } from '@/ai';
import type { TokenLargestAccount } from '@/services/helius';
import type { Stream } from '@streamflow/stream';
import type { ProgramAccount } from '@project-serum/anchor';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetTopHolders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    

    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Top Holders...`}
            result={{
                heading: (result: TopHoldersResultType) => result.body 
                    ? `Fetched Top Holders`
                    : `Failed to fetch top holders`,
                body: (result: TopHoldersResultType) => result.body 
                    ? <TopHolders body={result.body} mint={tool.args.tokenAddress} />
                    :  "No top holders found"
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
        />
    )
}

const TopHolders = ({ body, mint }: { body: TopHoldersResultBodyType, mint: string }) => {

    const [showAll, setShowAll] = useState(false);

    const [streamflowAccounts, setStreamflowAccounts] = useState<ProgramAccount<Stream>[]>([]);

    useEffect(() => {
        const fetchStreamflowAccounts = async () => {
            const accounts = await getStreamsByMint(mint);
            setStreamflowAccounts(accounts);
        }
        fetchStreamflowAccounts();
    }, [mint]);

    const knownAddressesWithStreamflow = streamflowAccounts.reduce((acc, account) => {
        acc[account.account.escrowTokens] = {
            name: "Streamflow Vault",
            logo: "/vesting/streamflow.png"
        }
        return acc;
    }, {} as Record<string, { name: string, logo: string }>)

    return (
        <div className="flex flex-col gap-2">
            <p className="text-md">
                {(body.percentageOwned * 100).toFixed(2)}% of the total supply is owned by the top 20 holders
            </p>
            <div className="flex flex-col gap-2">
                {body.topHolders.slice(0, showAll ? body.topHolders.length : 5).map((topHolder, index) => (
                    <TopHolder
                        key={topHolder.owner} 
                        topHolder={topHolder}
                        index={index}
                        knownAddresses={knownAddressesWithStreamflow}
                    />
                ))}
            </div>
            <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
            >
                {showAll ? "Show Less" : "Show All"}
            </Button>
        </div>
    )
}

const TopHolder = ({ topHolder, index, knownAddresses }: { topHolder: (TokenLargestAccount & { percentageOwned: number, owner: string }), index: number, knownAddresses: Record<string, { name: string, logo: string }> }) => {
    return (
        <Card className="flex flex-row items-center gap-2 p-2">
            <p className="text-sm text-muted-foreground">
                {index + 1})
            </p>
            <div className="flex flex-col">
                {
                    knownAddresses[topHolder.owner] ? (
                        <div className="flex flex-row items-center gap-2">
                            <Image
                                src={knownAddresses[topHolder.owner].logo}
                                alt={knownAddresses[topHolder.owner].name}
                                width={16}
                                height={16}
                            />
                            <p className="text-sm font-bold">
                                {knownAddresses[topHolder.owner].name}
                            </p>
                        </div>
                    ) : (
                        <WalletAddress 
                            address={topHolder.owner} 
                            className="text-sm font-bold"
                        />
                    )
                }
                <p className="text-xs">{topHolder.uiAmount.toLocaleString()} ({topHolder.percentageOwned.toFixed(2)}%)</p>
            </div>
        </Card>
    )
}

export default GetTopHolders;