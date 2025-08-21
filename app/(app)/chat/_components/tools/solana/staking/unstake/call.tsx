'use client'

import React, { useEffect } from 'react'

import { Card, Skeleton } from '@/components/ui';

import Swap from '../../../utils/swap';

import { useTokenDataByAddress } from '@/hooks';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import { useChain } from '@/app/_contexts/chain-context';

import { UnstakeResultBodyType, type UnstakeArgumentsType } from '@/ai';

interface Props {
    toolCallId: string,
    args: UnstakeArgumentsType,
}

const UnstakeCallBody: React.FC<Props> = ({ toolCallId, args }) => {

    const { addToolResult } = useChat();
    const { setCurrentChain } = useChain();

    // Set the current chain to Solana for unstaking
    useEffect(() => {
        setCurrentChain('solana');
    }, [setCurrentChain]);

    const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(args.contractAddress);
    const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress("So11111111111111111111111111111111111111112");
    
    return (
        <Card className="p-4 max-w-full">
            {
                inputTokenLoading || outputTokenLoading ? (
                    <Skeleton className="h-48 w-96 max-w-full" />
                ) : (
                    <Swap
                        initialInputToken={inputTokenData}
                        initialOutputToken={outputTokenData}
                        inputLabel="Unstake"
                        outputLabel="Receive"
                        initialInputAmount={args.amount?.toString()}
                        swapText="Unstake"
                        swappingText="Unstaking..."
                        onSuccess={(tx) => {
                            addToolResult<UnstakeResultBodyType>(toolCallId, {
                                message: `Unstake successful!`,
                                body: {
                                    tx,
                                    inputAmount: args.amount || 0,
                                    symbol: outputTokenData?.symbol || "",
                                }
                            });
                        }}
                        onError={(error) => {
                            addToolResult(toolCallId, {
                                message: `Unstake failed: ${error}`,
                            });
                        }}
                        onCancel={() => {
                            addToolResult(toolCallId, {
                                message: `Unstake cancelled`,
                            });
                        }}
                    />
                )
            }
        </Card>
    )
}

export default UnstakeCallBody