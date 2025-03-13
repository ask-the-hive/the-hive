'use client'

import React, { useEffect, useState } from 'react'

import { ChevronDown } from 'lucide-react';

import { VersionedTransaction } from '@solana/web3.js';

import Decimal from 'decimal.js';

import { Button, Separator } from '@/components/ui';

import LogInButton from '@/app/(app)/_components/log-in-button';

import TokenInput from './token-input';

import { useSendTransaction, useTokenBalance } from '@/hooks';

import { getSwapObj, getQuote } from '@/services/jupiter';

import { cn } from '@/lib/utils';

import { useChain } from '@/app/_contexts/chain-context';

import type { Token } from '@/db/types';

interface Props {
    initialInputToken: Token | null,    
    initialOutputToken: Token | null,
    inputLabel: string,
    outputLabel: string,
    initialInputAmount?: string,
    swapText?: string,
    swappingText?: string,
    onSuccess?: (txHash: string) => void,
    onError?: (error: string) => void,
    onCancel?: () => void,
    className?: string,
    priorityTokens?: string[]
}

const Swap: React.FC<Props> = ({ 
    initialInputToken, 
    initialOutputToken, 
    initialInputAmount, 
    swapText, 
    swappingText,
    onSuccess, 
    onError, 
    onCancel,
    className,
    inputLabel,
    outputLabel,
    priorityTokens
}) => {
    const { currentChain } = useChain();
    const [inputAmount, setInputAmount] = useState<string>(initialInputAmount || "");
    const [inputToken, setInputToken] = useState<Token | null>(initialInputToken);
    const [outputAmount, setOutputAmount] = useState<string>("");
    const [outputToken, setOutputToken] = useState<Token | null>(initialOutputToken);

    const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
    const [quoteResponse, setQuoteResponse] = useState<any | null>(null);
    const [isSwapping, setIsSwapping] = useState<boolean>(false);

    const { sendTransaction, wallet } = useSendTransaction();
    const { balance: inputBalance, isLoading: inputBalanceLoading } = useTokenBalance(inputToken?.id || "", wallet?.address || "");

    const onChangeInputOutput = () => {
        const tempInputToken = inputToken;
        const tempInputAmount = inputAmount;
        setInputToken(outputToken);
        setInputAmount(outputAmount);
        setOutputToken(tempInputToken);
        setOutputAmount(tempInputAmount);
    }

    const onSwap = async () => {
        if(!wallet || !quoteResponse) return;
        setIsSwapping(true);
        try {
            if (currentChain === 'solana') {
                const { swapTransaction } = await getSwapObj(wallet.address, quoteResponse);
                const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
                const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                const txHash = await sendTransaction(transaction);
                onSuccess?.(txHash);
            } else {
                // For BSC, we'll use the 0x swap quote
                const txHash = await sendTransaction(quoteResponse);
                onSuccess?.(txHash);
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setIsSwapping(false);
        }
    }

    useEffect(() => {
        if (inputToken && outputToken) {
            const fetchQuoteAndUpdate = async () => {
                setIsQuoteLoading(true);
                setOutputAmount("");
                try {
                    if (currentChain === 'solana') {
                        const quote = await getQuote(inputToken.id, outputToken.id, parseFloat(inputAmount) * (10 ** inputToken.decimals));
                        setQuoteResponse(quote);
                        setOutputAmount(new Decimal(quote.outAmount).div(new Decimal(10).pow(outputToken.decimals)).toString());
                    } else {
                        // For BSC, use 0x API
                        const response = await fetch(`/api/swap/bsc/quote?sellToken=${inputToken.id}&buyToken=${outputToken.id}&sellAmount=${parseFloat(inputAmount) * (10 ** inputToken.decimals)}`);
                        const quote = await response.json();
                        setQuoteResponse(quote);
                        setOutputAmount(new Decimal(quote.buyAmount).div(new Decimal(10).pow(outputToken.decimals)).toString());
                    }
                } catch (error) {
                    console.error('Error fetching quote:', error);
                } finally {
                    setIsQuoteLoading(false);
                }
            }

            if (inputAmount && Number(inputAmount) > 0) {
                fetchQuoteAndUpdate();
            } else {
                setQuoteResponse(null);
                setOutputAmount("");
            }
        }
    }, [inputToken, outputToken, inputAmount, currentChain]);

    const defaultPriorityTokens = currentChain === 'solana' 
        ? [
            'So11111111111111111111111111111111111111112', // SOL
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        ]
        : [
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            '0x55d398326f99059fF775485246999027B3197955', // USDT
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        ];

    return (
        <div className={cn("flex flex-col gap-4 w-96 max-w-full", className)}>
            <div className="flex flex-col gap-2 items-center w-full">
                <TokenInput
                    label={inputLabel}
                    amount={inputAmount}
                    onChange={setInputAmount}
                    token={inputToken}
                    onChangeToken={setInputToken}
                    address={wallet?.address}
                    priorityTokens={priorityTokens || defaultPriorityTokens}
                />
                <Button 
                    variant="ghost" 
                    size="icon"
                    className="group h-fit w-fit p-1"
                    onClick={onChangeInputOutput}
                >
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </Button>
                <TokenInput
                    label={outputLabel}
                    amount={outputAmount}
                    token={outputToken}
                    onChangeToken={setOutputToken}
                    address={wallet?.address}
                    priorityTokens={priorityTokens || defaultPriorityTokens}
                />
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
                {
                    wallet ? (
                        <Button 
                            variant="brand" 
                            className="w-full"
                            onClick={onSwap}
                            disabled={isSwapping || isQuoteLoading || !quoteResponse || !inputToken || !outputToken || !inputAmount || !outputAmount || !inputBalance || inputBalanceLoading || Number(inputAmount) > Number(inputBalance)}
                        >
                            {
                                isQuoteLoading 
                                    ? "Loading..." 
                                    : Number(inputAmount) > Number(inputBalance)
                                        ? "Insufficient balance"
                                        : isSwapping
                                            ? swappingText || "Swapping..."
                                            : swapText || "Swap"
                            }
                        </Button>
                    ) : (
                        <LogInButton />
                    )
                }
                {
                    onCancel && (
                        <Button variant="ghost" className="w-full" onClick={onCancel}>Cancel</Button>
                    )
                }
            </div>
        </div>
    )
}

export default Swap;