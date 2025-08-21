'use client'

import React, { useEffect } from 'react'

import { Card, Skeleton } from '@/components/ui';

import Swap from '../../../utils/swap';

import { useTokenDataByAddress } from '@/hooks';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import { useChain } from '@/app/_contexts/chain-context';

import type { StakeArgumentsType, StakeResultBodyType } from '@/ai';

interface Props {
    toolCallId: string,
    args: StakeArgumentsType,
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {

    const { addToolResult } = useChat();
    const { setCurrentChain } = useChain();

    // Set the current chain to Solana for staking
    useEffect(() => {
        setCurrentChain('solana');
    }, [setCurrentChain]);

    const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress("So11111111111111111111111111111111111111112");
    const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress(args.contractAddress);
    
    return (
        <Card className="p-4 max-w-full">
            {
                inputTokenLoading || outputTokenLoading ? (
                    <Skeleton className="h-48 w-96 max-w-full" />
                ) : (
                    <Swap
                        initialInputToken={inputTokenData}
                        initialOutputToken={outputTokenData}
                        inputLabel="Stake"
                        outputLabel="Receive"
                        initialInputAmount={args.amount?.toString()}
                        swapText="Stake"
                        swappingText="Staking..."
                        onSuccess={(tx) => {
                            addToolResult<StakeResultBodyType>(toolCallId, {
                                message: `Stake successful!`,
                                body: {
                                    tx,
                                    symbol: outputTokenData?.symbol || "",
                                }
                            });
                        }}
                        onError={(error) => {
                            addToolResult(toolCallId, {
                                message: `Stake failed: ${error}`,
                            });
                        }}
                        onCancel={() => {
                            addToolResult(toolCallId, {
                                message: `Stake cancelled`,
                            });
                        }}
                    />
                )
            }
        </Card>
    )
}

export default SwapCallBody