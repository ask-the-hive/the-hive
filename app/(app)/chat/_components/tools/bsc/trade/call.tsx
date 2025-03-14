'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useTokenMetadata } from '@/hooks/queries/token/use-token-metadata';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useChain } from '@/app/_contexts/chain-context';
import { BNB_METADATA, WBNB_ADDRESS, WBNB_METADATA } from '@/lib/config/bsc';
import type { TradeArgumentsType, TradeResultBodyType } from '@/ai/bsc/actions/trade/actions/types';
import TokenInput from '../../bsc/transfer/token-input';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import LogInButton from '@/app/(app)/_components/log-in-button';
import { ethers } from 'ethers';
import type { Token } from '@/db/types/token';

interface Props {
    toolCallId: string;
    args: TradeArgumentsType;
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {
    const { addToolResult } = useChat();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { setCurrentChain } = useChain();
    const [isSwapping, setIsSwapping] = useState(false);
    const [inputAmount, setInputAmount] = useState<string>(args.inputAmount?.toString() || "");
    const [isLoading, setIsLoading] = useState(true);
    
    // Set the current chain to BSC
    useEffect(() => {
        setCurrentChain('bsc');
    }, [setCurrentChain]);
    
    // Get the BSC wallet from args.walletAddress
    const bscWallet = wallets.find(w => w.address === args.walletAddress) || 
                     (user?.wallet?.address === args.walletAddress ? user.wallet : null);

    // Default to BNB or WBNB based on address for input token
    const [inputToken, setInputToken] = useState<Token | null>(() => {
        if (!args.inputTokenAddress || args.inputTokenAddress === "BNB") {
            return BNB_METADATA;
        }
        if (args.inputTokenAddress.toLowerCase() === WBNB_ADDRESS) {
            return WBNB_METADATA;
        }
        return null;
    });

    // Default to BNB or WBNB based on address for output token
    const [outputToken, setOutputToken] = useState<Token | null>(() => {
        if (!args.outputTokenAddress || args.outputTokenAddress === "BNB") {
            return BNB_METADATA;
        }
        if (args.outputTokenAddress.toLowerCase() === WBNB_ADDRESS) {
            return WBNB_METADATA;
        }
        return null;
    });
    
    // Search and fetch token metadata
    useEffect(() => {
        const fetchTokens = async () => {
            setIsLoading(true);
            try {
                // Handle input token
                if (args.inputTokenAddress && args.inputTokenAddress !== "BNB") {
                    if (args.inputTokenAddress.toLowerCase() === WBNB_ADDRESS) {
                        setInputToken(WBNB_METADATA);
                    } else {
                        // Search for token using the API endpoint
                        const response = await fetch(`/api/token/search?query=${encodeURIComponent(args.inputTokenAddress)}&chain=bsc&search_mode=fuzzy`);
                        const data = await response.json();
                        
                        const token = data.tokens?.[0];
                        if (token) {
                            setInputToken({
                                id: token.address,
                                name: token.name || "Unknown Token",
                                symbol: token.symbol || "UNKNOWN",
                                logoURI: token.logo_uri || "",
                                decimals: 18, // Default to 18 decimals for BSC tokens
                                tags: [],
                                freezeAuthority: null,
                                mintAuthority: null,
                                permanentDelegate: null,
                                extensions: {}
                            });
                        }
                    }
                }

                // Handle output token
                if (args.outputTokenAddress && args.outputTokenAddress !== "BNB") {
                    if (args.outputTokenAddress.toLowerCase() === WBNB_ADDRESS) {
                        setOutputToken(WBNB_METADATA);
                    } else {
                        // Search for token using the API endpoint
                        const response = await fetch(`/api/token/search?query=${encodeURIComponent(args.outputTokenAddress)}&chain=bsc&search_mode=fuzzy`);
                        const data = await response.json();
                        
                        const token = data.tokens?.[0];
                        if (token) {
                            setOutputToken({
                                id: token.address,
                                name: token.name || "Unknown Token",
                                symbol: token.symbol || "UNKNOWN",
                                logoURI: token.logo_uri || "",
                                decimals: 18, // Default to 18 decimals for BSC tokens
                                tags: [],
                                freezeAuthority: null,
                                mintAuthority: null,
                                permanentDelegate: null,
                                extensions: {}
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching token data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTokens();
    }, [args.inputTokenAddress, args.outputTokenAddress]);

    const onSwap = async () => {
        if (!bscWallet) {
            addToolResult<TradeResultBodyType>(toolCallId, {
                message: "No BSC wallet found",
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress,
                    error: "No BSC wallet found"
                }
            });
            return;
        }

        if (!inputToken || !outputToken) {
            addToolResult<TradeResultBodyType>(toolCallId, {
                message: "Please select both input and output tokens",
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress,
                    error: "Please select both input and output tokens"
                }
            });
            return;
        }

        setIsSwapping(true);

        try {
            const signer = await (bscWallet as any).getEthersJsSigner();
            // TODO: Implement 0x API swap logic here
            // For now, just return a mock success
            addToolResult<TradeResultBodyType>(toolCallId, {
                message: `Successfully swapped ${inputAmount} ${inputToken.symbol} for ${outputToken.symbol}`,
                body: {
                    transaction: "0x...", // Will be replaced with actual transaction hash
                    inputAmount: Number(inputAmount),
                    inputToken: inputToken.symbol,
                    outputToken: outputToken.symbol,
                    walletAddress: args.walletAddress,
                    success: true
                }
            });
        } catch (error) {
            console.error("Swap error:", error);
            addToolResult<TradeResultBodyType>(toolCallId, {
                message: `Swap failed: ${error instanceof Error ? error.message : String(error)}`,
                body: {
                    transaction: "",
                    inputAmount: 0,
                    inputToken: "",
                    outputToken: "",
                    walletAddress: args.walletAddress,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        } finally {
            setIsSwapping(false);
        }
    };

    // Define priority tokens for BSC
    const priorityTokens = [
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
        '0x55d398326f99059fF775485246999027B3197955', // USDT
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    ];

    if (isLoading) {
        return <Skeleton className="h-48 w-96" />;
    }

    return (
        <Card className="p-2 w-[384px]">
            <div className="flex flex-col items-center gap-2">
                <TokenInput
                    token={inputToken}
                    label="Sell"
                    amount={inputAmount}
                    onChange={(newAmount) => {
                        setInputAmount(newAmount);
                    }}
                    onChangeToken={(newToken) => {
                        setInputToken(newToken);
                    }}
                    priorityTokens={priorityTokens}
                />
                <ChevronDown className="w-4 h-4" />
                <TokenInput
                    token={outputToken}
                    label="Buy"
                    amount={""}
                    onChangeToken={(newToken) => {
                        setOutputToken(newToken);
                    }}
                    priorityTokens={priorityTokens}
                />
            </div>
            <Separator className="my-2" />
            <div className="flex flex-col gap-2">
                {
                    bscWallet ? (
                        <Button
                            variant="brand"
                            onClick={onSwap}
                            disabled={isSwapping || !inputToken || !outputToken || !inputAmount || Number(inputAmount) <= 0}
                            className="w-full"
                        >
                            {isSwapping ? "Swapping..." : "Swap"}
                        </Button>
                    ) : (
                        <div className="w-full">
                            <LogInButton />
                        </div>
                    )
                }
                <Button
                    variant="outline"
                    onClick={() => {
                        addToolResult<TradeResultBodyType>(toolCallId, {
                            message: "Swap cancelled",
                            body: {
                                transaction: "",
                                inputAmount: 0,
                                inputToken: "",
                                outputToken: "",
                                walletAddress: args.walletAddress,
                                error: "Swap cancelled by user"
                            }
                        });
                    }}
                    disabled={isSwapping}
                    className="w-full"
                >
                    Cancel
                </Button>
            </div>
        </Card>
    );
};

export default SwapCallBody; 